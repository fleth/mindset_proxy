using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Net;
using vtortola.WebSockets;

namespace MindWaveProxy
{
    class WebSocketServer
    {
        private CancellationTokenSource tokenSource;

        private CancellationToken token;

        /// クライアントのWebSocketインスタンスを格納
        private List<WebSocket> _client = new List<WebSocket>();
        
        /// WebSocketサーバースタート
        public async void StartServer(int port)
        {
            var endpoint = new IPEndPoint(IPAddress.Any, port);
            WebSocketListener server = new WebSocketListener(endpoint);
            var rfc6455 = new vtortola.WebSockets.Rfc6455.WebSocketFactoryRfc6455(server);
            server.Standards.RegisterStandard(rfc6455);
            server.Start();


            tokenSource = new CancellationTokenSource();
            token = tokenSource.Token;

            await Task.Run(() => Accept(server), token);

        }

        public async void Accept(WebSocketListener server)
        {
            while (!token.IsCancellationRequested)
            {
                var ws = await server.AcceptWebSocketAsync(token).ConfigureAwait(false);
                if (ws != null)
                {
                    await Task.Run(() => ProcessRequest(ws), token);
                }
            }

        }
        
        /// WebSocket接続毎の処理
        public async void ProcessRequest(WebSocket ws)
        {
            /// 新規クライアントを追加
            _client.Add(ws);
            /// 一定時間ごとに接続維持確認
            while (ws.IsConnected && !token.IsCancellationRequested)
            {
                await Task.Delay(5 * 1000);
            }
            /// クライアントを除外する
            _client.Remove(ws);
            ws.Dispose();
        }

        public void SendText(string message)
        {
            /// 各クライアントへ配信
            Parallel.ForEach(_client,
                p => p.WriteString(message));
        }
    }
}
