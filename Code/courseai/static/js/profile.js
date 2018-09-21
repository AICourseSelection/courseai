const PLAN_DELIMITER = '|';
const CODE_DELIMITER = '~';

function createDeleteBtn(code) {
    let btn = $('<button class="btn btn-outline-danger btn-default btn-delete">Delete</button>');
    btn.on('click', function() {
        // remove the code from the user's profile
        $.ajax({
            url: '/accounts/degree_plan_view',
            method: 'DELETE',
            data: {
                'code': code
            },
            success: function(data) {
                // remove the row
                btn.parent().parent().remove();
            }
        })
    });
    return btn;
}

function createLoadBtn(code, startYear, startSem) {
    let btn = $('<button class="btn btn-outline-success btn-default btn-load">Load</button>');
    btn.on('click', function() {
        let codeCell = $(this).parent().prev();
        if (codeCell.length !== 0) {
            var url = '/planner?startyear=' + startYear + '&semester=' + startSem + '&saveCode=' + code +
                '&degreeName=&degreeCode=&degreeName2=&degreeCode2=&';
            window.location = url;
        }
    });
    return btn;
}

$.ajax({
    url: '/accounts/degree_plan_view',
    success: function(data) {
        if (data.length > 1) {
            let plans = data.split(PLAN_DELIMITER);
            for (var i = 0; i < plans.length; i++)
                plans[i] = plans[i].split(CODE_DELIMITER);

            // insert degree plans into the table
            let tableBody = $('#codes-table').find('tbody');
            for (var i = 0; i < plans.length; i++) {
                let obj = JSON.parse(plans[i][1]);
                let code = plans[i][0];
                let row = $('<tr class="d-flex">');
                let btnsCol = $('<td class="col-2 btn-container row-fluid"/>');

                // row.append('<td class="">' + plans[i][0] + '</td>');                                                 // code
                row.append('<td class="col-2 text-center">' + obj.degrees.join(', ') + '</td>');                         // degrees
                row.append('<td class="col-4 text-center">' + obj.trackedMMS.join(', ') + '</td>');                      // mms
                row.append('<td class="col-2 text-center">' + 'Semester ' + obj.startSem + ' ' + obj.startYear + '</td>');   // start date
                row.append('<td class="col-2 text-center">' + obj.created + '</td>');                                   // created

                btnsCol.append(createLoadBtn(code, obj.startYear, obj.startSem));
                btnsCol.append(createDeleteBtn(code));
                row.append(btnsCol);
                tableBody.append(row);
            }
        }
    }
})
