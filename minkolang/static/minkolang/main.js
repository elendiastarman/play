function sendcode() {
	var code = $('#code-input').val();
	var input = $('#input-text').val();
	$('#output-text').text("");
	$('#stack-text').text("");
	$('#loops-text').text("");
	
	$('#run-button').attr('disabled', false);
	$('#step-button').attr('disabled', false);
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'code':code, 'action':'start', 'input':input, 'uid':$('#uid').text()},
		dataType: 'html',
		success: function(response) {
			$('#code-table').children().remove();
			$('#code-table').append(response);
			var permalinkHREF = "?code=" + encodeURIComponent(code)
			if (input) { permalinkHREF += "&input=" + encodeURIComponent(input) }
			$('#permalink').attr('href', permalinkHREF);
			$('#status-text').text("Status: ready!");
		},
		failure: function(response) { console.log(response); }
	});
};

function stepcode(steps) {
	if (steps == -1) {
		$('#run-button').toggle();
		$('#stop-button').toggle();
	}
	$('#status-text').text("Status: running...");
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'action':'step', 'steps':steps, 'uid':$('#uid').text()},
		dataType: 'json',
		success: function(response) {
			$('.cell_highlight').removeClass('cell_highlight');
			$('#output-text').html(response['output']);
			$('#stack-text').text(response['stack']);
			$('#loops-text').html(response['loops']);
			$('#code-table').find('table').eq(response['z']).find('tr').eq(response['y']).find('td').eq(response['x']).addClass('cell_highlight');
			
			$('#curr-inst').html("Current instruction: <kbd>"+response['currchar']+"</kbd>");
			
			if (steps == -1) {
				$('#run-button').toggle();
				$('#stop-button').toggle();
			}
			
			if (response['done']) {
				$('#run-button').attr('disabled', true);
				$('#step-button').attr('disabled', true);
				$('#status-text').text("Status: done!");
			} else {
				$('#status-text').text("Status: waiting...");
			}
		},
		failure: function(response) { console.log(response); }
	});
};

function slowcode(steps) {
	var stepLim = 100;
	
	while (stepLim > 0) {
		$.ajax({
			url: window.location,
			type: 'get',
			data: {'action':'step', 'steps':Math.min(steps, stepLim), 'uid':$('#uid').text()},
			dataType: 'json',
			success: function(response) {
				$('.cell_highlight').removeClass('cell_highlight');
				$('#output-text').text(response['output']);
				$('#stack-text').text(response['stack']);
				$('#loops-text').html(response['loops']);
				$('#code-table').find('table').eq(response['z']).find('tr').eq(response['y']).find('td').eq(response['x']).addClass('cell_highlight');
				
				stepLim -= steps;
			},
			failure: function(response) { console.log(response); stepLim = -1; }
		});
	}
};