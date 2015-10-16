function sendcode() {
	var code = $('#code-input').val();
	var input = $('#input-text').val();
	$('#output-text').text("");
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'code':code, 'action':'start', 'input':input, 'uid':$('#uid').text()},
		dataType: 'html',
		success: function(response) {
			$('#code-table').children('table').remove();
			$('#code-table').append(response);
		}
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
			$('.cell_highlight').removeClass('cell_highlight');
			$('#output-text').text(response['output']);
			$('#code-table > table').find('tr').eq(response['y']).find('td').eq(response['x']).addClass('cell_highlight');
			
			if (steps == -1) {
				$('#run-button').toggle();
				$('#stop-button').toggle();
			}
		}
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