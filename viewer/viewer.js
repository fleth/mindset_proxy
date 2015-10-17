$(function() {
	var data = {},
		totalPoints = 100;

	function createData(brainwave, options) {
		var keys = Object.keys(brainwave);
		keys.forEach(function(key){
			if(options.find("option[value|="+key+"]").length == 0){
				appendOption(options, key);
			}
			if(data[key] == undefined) data[key] = createInitData();
			if(data[key].length > 0)
					data[key] = data[key].slice(1);
			data[key].push(brainwave[key]);
		});

		var key = options.val();
		var res = [];
		for (var i = 0; i < data[key].length; ++i) {
			res.push([i, data[key][i]]);
		}
		return [{label: key, data: res}];
	}

	function appendOption(options, key){
		options.append($("<option>").val(key).html(key));
	}

	function createInitData(){
		var res = [];
		for(var i = 0; i < totalPoints; i++) {
			res[i] = 0;
		}
		return res;
	}

	var address = 'ws://localhost:9999';
	var ws = new WebSocket(address);
	ws.addEventListener('open', function() {
	  console.log('Connected');
	});
	ws.addEventListener('close', function() {
	  console.log('Connection lost');
	});
	ws.addEventListener('message', function(e) {
		console.log(e.data);
		var receivedData = JSON.parse(e.data);
		var createdData = createData(receivedData, $("#eeg_select"));
		var plot = $.plot("#eeg", createdData);
		plot.draw();
	});
});
