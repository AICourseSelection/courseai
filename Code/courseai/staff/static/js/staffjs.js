setTimeout(function () {
    $('#messagex').fadeOut('slow');
}, 10000);

$('#add_more').click(function() {
	var form_idx = $('#id_form-TOTAL_FORMS').val();
	$('#form_set').append($('#empty_form').html().replace(/__prefix__/g, form_idx));
	$('#id_form-TOTAL_FORMS').val(parseInt(form_idx) + 1);
});

var hideMessage = function(){
        $('#message').fadeOut('slow');
    };

$('#course_form').submit(function(event) {
            event.preventDefault();
			let code = document.getElementById("code").value;
            let year = document.getElementById("year").value;
            let name = document.getElementById("name").value;
            let session = document.getElementById("session").value;
            let units = document.getElementById("units").value;
            let description = document.getElementById("description").value;
            let outcome = document.getElementById("outcome").value;
            let prerequisite = document.getElementById("prerequisite").value;
			$.ajax({
                type:"POST",
                url: "../staff/save_course",
                data: {
                   "code": code, "year": year, "session": session, "units": units,
                    "name": name, "description": description, "outcome": outcome,
                    "prerequisite": prerequisite
                },
                dataType: "json",
                success: function (data) {
                    // reset all element
                    $('#code').removeClass().addClass('form-control');
                    $('#session').removeClass().addClass('form-control');
                    $('#units').removeClass().addClass('form-control');
                    $('#description').removeClass().addClass('form-control');
                    $('#name').removeClass().addClass('form-control');
                    $('#outcome').removeClass().addClass('form-control');
                    $('#prerequisite').removeClass().addClass('form-control');
                	if(data.response == 'success'){
                        $('#modal-title').html('Success!');
                        var mesej = 'Create a new course has been successful,' +
                            'click <strong><a href="../staff/course_detail?code=' + code + '&year=' + year +'&title=' + name + '" class="tooltip-test" title="Tooltip">here</a></strong>' +
                            ' to see the course';
                        $('#modal-body').html(mesej);
                        $('#modal-title').html('Success!');
                        $('#modal-header').removeClass().addClass('modal-header alert-success');
                        $('#error-modal').modal('show');
                    }
                	else if (data.response == 'validation'){
                        $('#msg').text(data.msg);
                        $('#message').show();
                        setTimeout(hideMessage,5000);
                        $('#' + data.element).removeClass().addClass('form-control is-invalid');
                    }
                	else {
                	    var mesej = 'Oops, something wrong, please try again in a few moments!';
                	    $('#modal-body').html(mesej);
                	    $('#modal-header').removeClass().addClass('modal-header alert-danger');
                	    $('#modal-title').html('Error!');
                        $('#error-modal').modal('show');
                    }
                }
            });
       });