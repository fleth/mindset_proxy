$(function() {
	var data = {};
	var totalPoints = 100;
	var message_plotted = false;
	var draw_timer_handler = null;

	function createData(brainwave, options) {
		var keys = Object.keys(brainwave);
		//存在しないkeyならoptionに追加する
		keys.forEach(function(key){
			if(options.find("option[value|="+key+"]").length == 0){
				appendOption(options, key);
			}
		});
		var options_children = options.children();
		for(var i=0; i<options_children.length; i++){
			var option = options_children.eq(i).text();
			if(data[option] == undefined) data[option] = createInitData();
			if(data[option].length > 0)
					data[option] = data[option].slice(1);
			if(brainwave[option] == undefined) {
				data[option].push(0);
			}else{
				data[option].push(brainwave[option]);
			}
		}

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

	function connect(address){
		var ws = new WebSocket(address);
		ws.addEventListener('open', function() {
	  		console.log('Connected');
	  		$('#message').text('Connected').css('color','lime');
		});
		ws.addEventListener('close', function() {
	  		console.log('Connection closed');
	  		$('#message').text('Connection closed').css('color','blue');
		});
		ws.addEventListener('message', function(e) {
			console.log(e.data);
			var receivedData = JSON.parse(e.data);
			createData(receivedData, $("#eeg_select"));
		});
		return ws;
	}

	function draw(){
		var createdData = createData([], $("#eeg_select"));
		var plot = $.plot("#eeg", createdData);
		plot.draw();
	}

	var websocket = connect($("#wssURL").val());
	$("#reconnect").click(function(){
		websocket.close();
		clearInterval(draw_timer_handler);
		websocket = connect($("#wssURL").val());
		draw_timer_handler = setInterval(draw, $("#speed").val());
	});

	draw_timer_handler = setInterval(draw, $("#speed").val());

	chrome.app.window.current().innerBounds.setSize(900, 570);
});
