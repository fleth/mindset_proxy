'use strict';

var connectionId = -1;
var port = 9999

function $(objectId){
  return document.getElementById(objectId);
}

function onConnect(connectionInfo) {
  if (!connectionInfo) {
    setStatus('Could not open', 'red');
    $('connectb').disabled = false;
    $('port-picker').disabled = false;
    $('wssPort').disabled = false;
    return;
  }
  connectionId = connectionInfo.connectionId;
  console.log(connectionInfo);
  setStatus('Connected', 'lime');
  $('connectb').innerText = "disconnect";
  $('connectb').disabled = false;
  switchEventListener($('connectb'), "click", openSelectedPort, disconnect);
  websocket.start(
  	$('wssPort'),
  	$('wssStatus'),
  	$('wssURL')
  );
  $('viewer_url').hidden = false
  chrome.serial.onReceive.addListener(onReceive);
}

function onReceive(info){
  var data = [];
  var intData = new Uint8Array(info.data);
  for(var i = 0, l = info.data.byteLength; i < l ; i++) {
    data[i] = intData[i];
  }
  mindset_binary_parser(data, onData);
}

function onData(data){
  websocket.send(JSON.stringify(data));
}

function disconnect(){
  if (connectionId != -1) {
    chrome.serial.setPaused(connectionId, true, function(){
      chrome.serial.disconnect(connectionId, function(result){
        if(result){
          $('connectb').disabled = true;
          setStatus('Disconnected', 'blue');
          connectionId = -1;
          $('connectb').innerText = "connect";
          websocket.stop();
          $('viewer_url').hidden = true;
          switchEventListener($('connectb'), "click", disconnect, openSelectedPort);
          $('connectb').disabled = false;
          $('wssPort').disabled = false;
          $('port-picker').disabled = false;
        }
      });
    });
    return;
  }
}

function setStatus(status, color) {
  $('status').innerHTML = status.fontcolor(color).bold();
}

function switchEventListener(objcet, event, removeListener, addListener){
  objcet.removeEventListener(event, removeListener);
  objcet.addEventListener(event, addListener);
}

function buildPortPicker(ports) {
  var eligiblePorts = ports.filter(function(port) {
    return !port.path.match(/[Bb]luetooth/);
  });

  var portPicker = $('port-picker');
  eligiblePorts.forEach(function(port) {
    var portOption = document.createElement('option');
    portOption.value = portOption.innerText = port.path;
    portPicker.appendChild(portOption);
  });

}

function openSelectedPort() {
  setStatus("Connecting...", 'olive');
  var portPicker = $('port-picker');
  var selectedPort = portPicker.options[portPicker.selectedIndex].value;
  portPicker.disabled = true;
  $('wssPort').disabled = true;
  $('connectb').disabled = true;
  chrome.serial.connect(selectedPort,onConnect);
}

function serialCloseAll(){
  chrome.serial.getConnections(function(infos){
    infos.forEach(function(info){
      chrome.serial.setPaused(info.connectionId, true, function(){
        chrome.serial.disconnect(info.connectionId, function(result){
        });
      });
    });
  });
}

function socketCloseAll(){
  chrome.sockets.tcpServer.getSockets(function(infos){
    infos.forEach(function(info){
      chrome.sockets.tcpServer.close(info.socketId);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.app.window.current().innerBounds.setSize(260, 110);
  socketCloseAll();
  serialCloseAll();
  setStatus('Disconnected', 'blue');
  chrome.serial.getDevices(function(devices) {
    buildPortPicker(devices);
  });
  $('viewer_url').addEventListener('click', function(){
    window.chrome.app.window.create(
      'viewer/viewer.html',
      {'id': 'ViewerWindowID',
       'innerBounds': {
         minWidth: 900,
         minHeight: 550,
         maxWidth: 900,
         maxHeight: 550
       }
      });
    });
  switchEventListener($('connectb'), "click", null, openSelectedPort);
});
