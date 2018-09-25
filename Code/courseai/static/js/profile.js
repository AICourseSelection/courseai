const PLAN_DELIMITER = '|';
const CODE_DELIMITER = '~';

let degreeDict = {}; // mapping of degree codes to titles
let majorDict = {}; // mapping of major codes to titles
let minorDict = {}; // mapping of minor codes to titles
let specDict = {}; // mapping of specialisation codes to titles

function createDeleteBtn(code) {
    let btn = $('<button class="btn btn-outline-danger btn-sm btn-delete">Delete</button>');
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
    let btn = $('<button class="btn btn-outline-success btn-sm btn-load mb-1">Load</button>');
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

function stringifyDegreeCodes(degreeCodes) {
    let str = "";
    for (let i = 0; i < degreeCodes.length; i++) {
        if (i !== 0) str += ", ";
        str += degreeDict[degreeCodes[i]];
    }
    return str;
}

function stringifyMMS(mms) {
    let str = "";
    for (let i = 0; i < mms.length; i++) {
        let code = mms[i].code;
        let year = mms[i].year;
        let type = code.substr(code.length - 3);
        if (i !== 0) str += ", ";

        if (type === 'MAJ') str += majorDict[code + year];
        else if (type === 'MIN') str += minorDict[code + year];
        else str += specDict[code + year];

        str +=  ' (' + type + ')';
    }
    return str;
}

// create dictionary of degree codes to titles
$.ajax({
    url: '/degree/all',
    success: function (data) {
        for (i in data.response) {
            degreeDict[String(data.response[i].code)] = data.response[i].title;
        }
    }
});

function mapMMSCodeToTitle(queryName, dict) {
    return $.ajax({
        url: '/search/' + queryName,
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            for (var i = 0; i < data.response.length; i++) {
                let code = data.response[i]._source.code;
               let mms = data.response[i]._source.versions; 
               for (var obj in mms) {
                   dict[String(code) + String(obj)] = mms[obj].title;
               }
            }
        }
    });
}

function createSavedPlansTable() {
    $.ajax({
        url: '/accounts/degree_plan_view',
        success: function(data) {
            if (data.length > 1) {
                let plans = data.split(PLAN_DELIMITER);
                for (var i = 0; i < plans.length; i++)
                    plans[i] = plans[i].split(CODE_DELIMITER);

                // insert degree plans into the table
                let tableBody = $('#saved-plans-table').find('tbody');
                for (var i = 0; i < plans.length; i++) {
                    let obj = JSON.parse(plans[i][1]);
                    let code = plans[i][0];
                    let row = $('<tr class="d-flex">');
                    let btnsCol = $('<td class="col-1 btn-container text-center"/>');
                    let textarea = $('<textarea class="plan-name-input form-control" placeholder="edit name"/>');

                    let nameInput = $('<td class="col-2 name-td"/>').append(textarea);                                              
                    row.append(nameInput);
                    row.append('<td class="col-1 text-center">' + plans[i][0] + '</td>');                                // code
                    row.append('<td class="col-2 text-center">' + stringifyDegreeCodes(obj.degrees) + '</td>');                  // degrees
                    row.append('<td class="col-4 text-center">' + stringifyMMS(obj.trackedMMS) + '</td>');                       // mms
                    row.append('<td class="col-1 text-center">' + 'Semester ' + obj.startSem + ' ' + obj.startYear + '</td>');   // start date
                    row.append('<td class="col-1 text-center">' + obj.created + '</td>');                                       // created

                    btnsCol.append(createLoadBtn(code, obj.startYear, obj.startSem));
                    btnsCol.append(createDeleteBtn(code));
                    row.append(btnsCol);
                    tableBody.append(row);
                }
            }
        }
    })
}

$.when(mapMMSCodeToTitle('majors', majorDict), 
    mapMMSCodeToTitle('minors', minorDict), 
    mapMMSCodeToTitle('specs', specDict)).done(function() {
        createSavedPlansTable();
    });
