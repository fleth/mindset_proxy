using System;
using System.Windows.Forms;

namespace MindWaveProxy
{
    public partial class Form1 : Form
    {
        private MindWaveConnector mindwaveConnector;
        private WebSocketServer websocketServer;

        public Form1()
        {
            InitializeComponent();
            mindwaveConnector = new MindWaveConnector();
            websocketServer = new WebSocketServer();
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void Form1_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
        }

        private void onWebSocketMessageReceive(string message)
        {
            websocketServer.SendText(message);
            Invoke(new MindWaveConnector.OnReceive(appendLog), message);
        }

        private void appendLog(string message)
        {
            richTextBox1.AppendText(message+"\n");
        }

        private void onRecordStopped(string filePath)
        {
            Console.WriteLine(filePath);
            MessageBox.Show(filePath, "保存しました", MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
        }
        
        private void button1_Click(object sender, EventArgs e)
        {
            var port = Int32.Parse(textBox1.Text);
            try
            {
                mindwaveConnector.Connect(onWebSocketMessageReceive, checkBox1.Checked);
            }
            catch (System.Net.Sockets.SocketException)
            {
                MessageBox.Show("ThinkGearConnectorを起動してください", "接続に失敗しました", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            websocketServer.StartServer(port);

            button1.Enabled = false;
            button2.Enabled = true;
            button3.Enabled = true;
            checkBox1.Enabled = false;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            mindwaveConnector.StopRecord();
            mindwaveConnector.Disconnect();
            websocketServer.StopServer();

            button1.Enabled = true;
            button2.Enabled = false;
            button3.Enabled = false;
            button4.Enabled = false;
            checkBox1.Enabled = true;
        }

        private void button3_Click(object sender, EventArgs e)
        {
            mindwaveConnector.StartRecord(onRecordStopped);

            button3.Enabled = false;
            button4.Enabled = true;
        }

        private void button4_Click(object sender, EventArgs e)
        {
            mindwaveConnector.StopRecord();

            button3.Enabled = true;
            button4.Enabled = false;
        }
    }
}
