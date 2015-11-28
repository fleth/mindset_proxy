
var websocket = {};

if (http.Server && http.WebSocketServer) {
  websocket = {
    url: null,
    port: null,
    status: null,
    server: null,
    wsServer: null,
    connectedSockets: [],
    start: function(port, status, url){
      this.url = url;
      this.port = port;
      this.status = status;
      this.server = new http.Server();
      this.wsServer = new http.WebSocketServer(this.server);
      this.wsServer.addEventListener('request', this.onRequest.bind(this));
      this.server.listen(parseInt(port.value));
      this.setStatus('started', 'lime');
      this.url.value = 'ws://localhost:'+port.value+'/';
      this.port.disabled = true;
    },
    onRequest: function(req){
      var socket = req.accept();
      this.connectedSockets.push(socket);

      socket.addEventListener('close', function() {
        for (var i = 0; i < this.connectedSockets.length; i++) {
          if (this.connectedSockets[i] == socket) {
            this.connectedSockets.splice(i, 1);
            break;
          }
        }
      }.bind(this));
      return true;
    },
    send: function(data){
      for (var i = 0; i < this.connectedSockets.length; i++)
        this.connectedSockets[i].send(data);
    },
    stop: function(){
      for (var i = 0; i < this.connectedSockets.length; i++)
        this.connectedSockets[i].close();

      this.server.close();

      this.setStatus('stopped', "blue");
      this.url.value = '';
      this.port.disabled = false;
    },
    setStatus: function(status, color){
      this.status.innerHTML = status.fontcolor(color).bold();
    }
  }
}
