using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
            mindwaveConnector.StopRecord();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            mindwaveConnector.Connect(onWebSocketMessageReceive);
            websocketServer.StartServer(9999);
        }

        private void onWebSocketMessageReceive(string message)
        {
            websocketServer.SendText(message);
        }

        private void onRecordStopped(string filePath)
        {
            Console.WriteLine(filePath);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            mindwaveConnector.StartRecord(onRecordStopped);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            mindwaveConnector.StopRecord();
        }
    }
}
