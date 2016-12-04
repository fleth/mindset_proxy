var connectionId = -1;
var port = 9999;

function $(objectId) {
    return document.getElementById(objectId);
}

function onData(data) {
    websocket.send(JSON.stringify(data));
}

function onReceive(info) {
    var data = [];
    var intData = new Uint8Array(info.data);
    for (var i = 0, l = info.data.byteLength; i < l; i++) {
        data[i] = intData[i];
    }
    mindset_binary_parser(data, onData);
}

function onConnect(connectionInfo) {
    if (!connectionInfo) {
        setStatus('Could not open', 'red', $('status'));
        setDisabled(false);
        return;
    }
    connectionId = connectionInfo.connectionId;
    console.log(connectionInfo);
    setStatus('Connected', 'lime', $('status'));
    $('connectb').innerText = "disconnect";
    $('connectb').disabled = false;
    switchEventListener($('connectb'), "click", openSelectedPort, closeConnectedPort);

    websocket.start(parseInt($('wssPort').value));
    chrome.serial.onReceive.addListener(onReceive);
}

function disconnect(id) {
    chrome.serial.setPaused(id, true, function () {
        chrome.serial.disconnect(id, function (result) {
            if (result) {
                setStatus('Disconnected', 'blue', $('status'));
                $('connectb').innerText = "connect";
                $('connectb').disabled = false;
                $('port-picker').disabled = false;
                switchEventListener($('connectb'), "click", closeConnectedPort, openSelectedPort);
            }
        });
    });
}

function onStart() {
    setStatus('started', 'lime', $('wssStatus'))
    $('wssURL').value = 'ws://localhost:' + $('wssPort').value + '/';
    $('wssPort').disabled = true;
    $('viewer_url').hidden = false
}

function onStop() {
    setStatus('stopped', "blue", $('wssStatus'));
    $('wssURL').value = '';
    $('wssPort').disabled = false;
    $('viewer_url').hidden = true;
}

function openSelectedPort() {
    setStatus("Connecting...", 'olive', $('status'));
    var portPicker = $('port-picker');
    var selectedPort = portPicker.options[portPicker.selectedIndex].value;
    setDisabled(true);
    chrome.serial.connect(selectedPort, onConnect);
}

function closeConnectedPort() {
    if (connectionId != -1) {
        $('connectb').disabled = true;
        disconnect(connectionId);
        websocket.stop();
        connectionId = -1;
    } else {
        return;
    }
}

function serialCloseAll() {
    chrome.serial.getConnections(function (infos) {
        infos.forEach(function (info) {
            disconnect(info.connectionId);
        });
    });
}

function socketCloseAll() {
    chrome.sockets.tcpServer.getSockets(function (infos) {
        infos.forEach(function (info) {
            chrome.sockets.tcpServer.close(info.socketId);
        });
    });
}

function buildPortPicker(ports) {
    var eligiblePorts = ports.filter(function (port) {
        return !port.path.match(/[Bb]luetooth/);
    });

    var portPicker = $('port-picker');
    eligiblePorts.forEach(function (port) {
        var portOption = document.createElement('option');
        portOption.value = portOption.innerText = port.path;
        portPicker.appendChild(portOption);
    });
}

function setDisabled(disabled) {
    $('connectb').disabled = disabled;
    $('port-picker').disabled = disabled;
    $('wssPort').disabled = disabled;
}

function setStatus(status, color, target) {
    target.innerHTML = status.fontcolor(color).bold();
}

function switchEventListener(objcet, event, removeListener, addListener) {
    objcet.removeEventListener(event, removeListener);
    objcet.addEventListener(event, addListener);
}

document.addEventListener('DOMContentLoaded', function () {
    chrome.app.window.current().innerBounds.setSize(300, 150);
    socketCloseAll();
    serialCloseAll();
    chrome.serial.getDevices(function (devices) {
        buildPortPicker(devices);
    });
    websocket.onStop = onStop;
    websocket.onStart = onStart;
    $('viewer_url').addEventListener('click', function () {
        window.chrome.app.window.create('viewer/viewer.html', {
            'id': 'ViewerWindowID',
            'resizable': false
        });
    });
    switchEventListener($('connectb'), "click", null, openSelectedPort);
});
