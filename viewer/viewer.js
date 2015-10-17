$(function() {
	var data = {},
		totalPoints = 100;

	function createData(brainwave, choices) {
		var keys = Object.keys(brainwave);
		keys.forEach(function(key){
			if(data[key] == undefined) data[key] = createInitData();
			if(data[key].length > 0)
					data[key] = data[key].slice(1);
			data[key].push(brainwave[key]);
			if(choices.find("input[name|="+key+"]").length == 0)
				appendCheckbox(choices, key);
		});
		return createResponse(keys, choices);
	}

	function createResponse(keys, choices){
		return keys.map(function(key){
			var chk = choices.find("input[name|="+key+"]")[0];
			if(chk == undefined || chk.checked == false) return {};

			var d = data[key];
			var res = [];
			for (var i = 0; i < d.length; ++i) {
				res.push([i, d[i]]);
			}
			return {label: key, data: res};
		});
	}

	function appendCheckbox(choices, key){
		choices.append("<br/><input type='checkbox' name='" + key +
			"' checked='checked' id='id" + key + "'></input>" +
			"<label for='id" + key + "'>"
			+ key + "</label>");
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
		var receivedData = JSON.parse(e.data)
		if(receivedData.rawEeg == undefined) {
			var createdData = createData(receivedData, $("#asic_eeg_choices"));
			var plot = $.plot("#asic_eeg", createdData);
			plot.draw();
		} else {
			var createdData = createData(receivedData, $("#raw_eeg_choices"));
			var plot = $.plot("#raw_eeg", createdData);
			plot.draw();
		}
	});
});
