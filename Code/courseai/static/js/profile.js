function createDeleteBtn(code) {
    let btn = $('<button class="btn btn-danger btn-delete">Delete</button>');
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

function createLoadBtn() {
    let btn = $('<button class="btn btn-success load-btn">Load</button>');
    btn.on('click', function() {
        let codeCell = $(this).parent().prev();
        if (codeCell.length !== 0) {
            let code = codeCell.text();
            alert('loading');
        }
    });
    return btn;
}

function stringifyDegrees(degreesList) {
    str = "";
    for (var i = 0; i < degreesList.length; i++) {
        if (i != 0) str += ", ";
        str += degreesList[i].code;
    }
    return str;
}

function stringifyMMS(mmsList) {
    str = "";
    for (var i = 0; i < mmsList; i++) {
        if (i != 0) str += ", ";
        str += mmsList[i];
    }
    return str;
}

function calculateStartYear(degrees) {
    let startYear = Infinity;
    for (var j = 0; j < degrees.length; j++) {
        if (degrees[j].year < startYear) startYear = degrees[j].year;
    }
    return startYear;
}

$.ajax({
    url: '/accounts/degree_plan_view',
    success: function(data) {
        if (data.length > 1) {
            let plans = data.split("|");
            for (var i = 0; i < plans.length; i++) 
                plans[i] = plans[i].split('~')

            let tableBody = $('#codes-table').find('tbody');
            for (var i = 0; i < plans.length; i++) {
                let obj = JSON.parse(plans[i][1]);
                let code = plans[i][0];
                let row = $('<tr>');
                let btnsCol = $('<td class="w-25" align="right"/>');
                let startYear = calculateStartYear(obj.degrees);                           
                             
                row.append('<td class="">' + plans[i][0] + '</td>');                                    // code
                row.append('<td class="">' + stringifyDegrees(obj.degrees) + '</td>');                  // degrees
                row.append('<td class="">' + stringifyMMS(obj.trackedMMS) + '</td>');                   // mms
                row.append('<td class="">' + 'Semester ' + obj.startSem + ' ' + startYear + '</td>');   // start date
                row.append('<td class="">' + obj.date.toString() + '</td>');                            // created
                
                btnsCol.append(createDeleteBtn(code));
                row.append(btnsCol);
                tableBody.append(row);
            }
        }
    }
})
