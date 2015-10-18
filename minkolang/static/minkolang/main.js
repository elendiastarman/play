function sendcode() {
	var code = $('#code-input').val();
	var input = $('#input-text').val();
	$('#output-text').text("");
	$('#stack-text').text("");
	$('#loops-text').text("");
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'code':code, 'action':'start', 'input':input, 'uid':$('#uid').text()},
		dataType: 'html',
		success: function(response) {
			console.log(response);
			$('#code-table').children().remove();
			$('#code-table').append(response);
		},
		failure: function(response) { console.log(response); }
	});
};

function stepcode(steps) {
	if (steps == -1) {
		$('#run-button').toggle();
		$('#stop-button').toggle();
	}
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'action':'step', 'steps':steps, 'uid':$('#uid').text()},
		dataType: 'json',
		success: function(response) {
			console.log(response);
			$('.cell_highlight').removeClass('cell_highlight');
			$('#output-text').text(response['output']);
			$('#stack-text').text(response['stack']);
			$('#loops-text').html(response['loops']);
			$('#code-table').find('table').eq(response['z']).find('tr').eq(response['y']).find('td').eq(response['x']).addClass('cell_highlight');
			
			if (steps == -1) {
				$('#run-button').toggle();
				$('#stop-button').toggle();
			}
		},
		failure: function(response) { console.log(response); }
	});
};

function stopcode() {
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'action':'stop'},
		dataType: 'json',
		success: function(response) {
			$('#run-button').toggle();
			$('#stop-button').toggle();
		}
	});
};