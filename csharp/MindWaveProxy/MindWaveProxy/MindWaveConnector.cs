using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Net.Sockets;
using Newtonsoft.Json;

namespace MindWaveProxy
{
    class MindWaveConnector
    {
        private CancellationTokenSource readingTokenSource;

        private TcpClient tcpClient;

        private string applicationName = "MindWaveConnector";

        private Task readingTask;

        private OnReceive readingReceiver;

        private OnReceive recordingReceiver;

        public delegate void OnReceive(string data);

        public MindWaveConnector()
        {
            tcpClient = new TcpClient("127.0.0.1", 13854);

            byte[] buffer = Encoding.ASCII.GetBytes(@"{
                ""enableRawOutput"": false,
                ""format"": ""Json""
            }");

            Send(buffer);
        }

        ~MindWaveConnector()
        {
            Disconnect();
        }

        public async void Disconnect()
        {
            if (readingTokenSource != null)
            {
                readingTokenSource.Cancel();
            }
        }

        public void Connect(OnReceive onReceive) {
            readingReceiver = onReceive;

            readingTokenSource = new CancellationTokenSource();
            var token = readingTokenSource.Token;

            readingTask = new Task(() => Receive(OnReceived, token), token);
            readingTask.Start();
        }

        public void StartRecord(OnReceive onReceive)
        {
            byte[] buffer = Encoding.ASCII.GetBytes(@"{
                ""startRecording"": {
                    ""poorSignalLevel"": true,
                    ""eSense"": true,
                    ""eegPower"": true,
                    ""blinkStrength"": true
                },
                ""applicationName"": """+applicationName+@"""
            }");

            if (!Send(buffer))
            {
                return;
            }
            recordingReceiver = onReceive;
        }

        public void StopRecord()
        {
            byte[] buffer = Encoding.ASCII.GetBytes(@"{
                ""stopRecording"": """+applicationName+@"""
            }");

            Send(buffer);
        }

        private void StopRecordReceiving(string data, OnReceive onReceive)
        {
            var definition = new { status = "", sessionId = 0, filePath = "" };

            try
            {
                var json = JsonConvert.DeserializeAnonymousType(data, definition);

                if (json.status == "recordingStopped" && json.filePath != null)
                {
                    onReceive(json.filePath);
                }
            }
            catch(System.Exception e)
            {
                System.Console.WriteLine(e.Message);
            }
        }

        private bool Send(byte[] buffer) {
            var stream = tcpClient.GetStream();

            if (stream.CanWrite)
            {
                stream.Write(buffer, 0, buffer.Length);
                return true;
            }
            return false;
        }

        private void OnReceived(string data)
        {
            readingReceiver(data);
            StopRecordReceiving(data, recordingReceiver);
        }

        private void Receive(OnReceive onReceive, CancellationToken token)
        {
            var stream = tcpClient.GetStream();
            byte[] buffer = new byte[2048];

            while (!token.IsCancellationRequested)
            {
                if (!stream.CanRead)
                {
                    continue;
                }

                var bytesRead = stream.Read(buffer, 0, 2048);
                string[] packets = Encoding.UTF8.GetString(buffer, 0, bytesRead).Split('\r');
                
                foreach (string s in packets)
                {
                    var data = s.Trim();
                    if(data != string.Empty)
                    {
                        System.Console.WriteLine(data);
                        onReceive(data);
                    }
                }
            }
        }
    }
}
