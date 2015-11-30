
var websocket = {};

if (http.Server && http.WebSocketServer) {
  websocket = {
    server: null,
    wsServer: null,
    connectedSockets: [],
    onStop: function(){},
    onStart: function(){},
    start: function(port){
      this.server = new http.Server();
      this.wsServer = new http.WebSocketServer(this.server);
      this.wsServer.addEventListener('request', this.onRequest.bind(this));
      this.server.listen(port);
      this.onStart();
    },
    send: function(data){
      for (var i = 0; i < this.connectedSockets.length; i++)
        this.connectedSockets[i].send(data);
    },
    stop: function(){
      for (var i = 0; i < this.connectedSockets.length; i++)
        this.connectedSockets[i].close();

      this.server.close();
      this.onStop();
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
    }
  }
}
