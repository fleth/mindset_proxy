using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Net.Sockets;
using Newtonsoft.Json;

namespace MindWaveProxy
{
    class MindWaveConnector
    {
        private CancellationTokenSource readingTokenSource;

        private CancellationTokenSource recordingTokenSource;

        private TcpClient tcpClient;

        private string applicationName = "MindWaveConnector";

        public delegate void OnReceive(string data);

        public MindWaveConnector()
        {
        }

        ~MindWaveConnector()
        {
            Disconnect();
        }

        public void Disconnect()
        {
            tcpClient.Close();
        }

        public async void Connect(OnReceive onReceive) {
            tcpClient = new TcpClient("127.0.0.1", 13854);

            byte[] buffer = Encoding.ASCII.GetBytes(@"{
                ""enableRawOutput"": false,
                ""format"": ""Json""
            }");

            Send(buffer);

            readingTokenSource = new CancellationTokenSource();
            var token = readingTokenSource.Token;

            await Task.Run(() => Receive(onReceive, token), token);
        }

        public async void StartRecord(OnReceive onReceive)
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

            Send(buffer);

            recordingTokenSource = new CancellationTokenSource();
            var token = recordingTokenSource.Token;

            await Task.Run(() => Receive((data) => StopRecordReceiving(data, onReceive), token), token);
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

            System.Console.WriteLine(data);

            var definition = new { status = "", sessionId = 0, filePath = "" };

            var json = JsonConvert.DeserializeAnonymousType(data, definition);

            if(json.status == "recordingStopped" && json.filePath != null)
            {
                onReceive(json.filePath);
                recordingTokenSource.Cancel();
            }
        }

        private void Send(byte[] buffer) {
            var stream = tcpClient.GetStream();

            if (stream.CanWrite)
            {
                stream.Write(buffer, 0, buffer.Length);
            }
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
