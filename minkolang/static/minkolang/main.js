function sendcode() {
	var code = $('#code-input').val();
	var input = $('#input-text').val();
	$('#output-text').text("");
	
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'code':code, 'action':'start', 'input':input},
		dataType: 'html',
		success: function(response) {
			$('#code-table').children('table').remove();
			$('#code-table').append(response);
		}
	});
};

function stepcode(steps) {
	$.ajax({
		url: window.location,
		type: 'get',
		data: {'action':'step', 'steps':steps},
		dataType: 'json',
		success: function(response) {
			$('.cell_highlight').removeClass('cell_highlight');
			$('#output-text').text(response['output']);
			$('#code-table > table').find('tr').eq(response['y']).find('td').eq(response['x']).addClass('cell_highlight');
		}
	});
};