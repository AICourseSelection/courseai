// Reference Constants
const SESSION_WORDS = {
    'Su': 'Summer Session',
    'S1': 'First Semester',
    'Au': 'Autumn Session',
    'Wi': 'Winter Session',
    'S2': 'Second Semester',
    'Sp': 'Spring Session'
};

let SESSION_ABBREVS = {};
for (const abb in SESSION_WORDS) SESSION_ABBREVS[SESSION_WORDS[abb]] = abb;

const THIS_YEAR = (new Date()).getFullYear().toString();
const ELECTIVE_TEXT = "Elective Course";

const MMS_CLASS_NAME = 'mms-course-list';
let allMMSCourseCodes = {}; // mapping of MMS codes to an array of course codes
let compulsoryCourseCodes = [];
const COLOR_CLASSES = ['invalid-cell', 'mms-course-list1', 'mms-course-list2', 'mms-course-list3', 'mms-course-list4', 'mms-course-list0', 'added-elective', 'compulsory']; // list of classes used for colouring cells - used when clearing plans
const COLOR_CLASSES_STR = COLOR_CLASSES.join(' ');
let colorMappings = {};

const NUM_ADD_SESSIONS_END = 5; // number of add-able sessions at the end of the plan at any time

// UI Functions
async function addDegree(code, year) {
    let add = await PLAN.addDegree(code, year);
    if (!add) console.log("Tried to add degree " + code + " (" + year + "), already present.");
    let titleHTML = '<a href="https://programsandcourses.anu.edu.au/' + PLAN.degrees[0].year +
        '/program/' + PLAN.degrees[0].code + '" target="_blank">' + PLAN.degrees[0].title + '</a>';
    if (PLAN.degrees[1]) {
        titleHTML += ' and <a href="https://programsandcourses.anu.edu.au/' + PLAN.degrees[1].year +
            '/program/' + PLAN.degrees[1].code + '" target="_blank">' + PLAN.degrees[1].title + '</a>';
        reorganiseDegreeTracker(true);
    }
    titleHTML += " starting " + start_year + " Semester " + start_sem;
    $('#degree-title-text').html(titleHTML);
    return add;
}

function clearAllCourses() {
    PLAN.clearAllCourses();
    PLAN.clearWarnings();
    for (let box of $('#plan-grid').find('.plan-cell')) {
        $(box).popover('dispose');
        if ($(box).find('.course-code').text() !== ELECTIVE_TEXT) $(box).draggable('destroy');
        makeSlotDroppable($(box));
        $(box).find('.course-code').text(ELECTIVE_TEXT);
        $(box).find('.course-title').text('');
        $(box).removeClass(COLOR_CLASSES_STR);
    }
    updateProgress();
    updateWarningNotices();
}

function resetPlan() {
    SAVER.disableSaving();
    clearPlanner();
    setupPlanner(true);
}

function addLinearGradient(colorClasses, box) {
    const cssBrowserGradients = ['-webkit-', '-moz-', '-o-', '-ms-'];
    for (var j = 0; j < cssBrowserGradients.length; j++) {
        let cssBackgroundStr = cssBrowserGradients[j] + 'linear-gradient(135deg';

        let percent = 100 / colorClasses.length;
        for (var i = 0; i < colorClasses.length; i++) {
            let divisions = (i == colorClasses.length - 1) ? 100 - percent : (i + 1) * percent;
            // add additional color stop to create hard lines between colors
            if (i > 0 && i < colorClasses.length - 1) {
                cssBackgroundStr += "," + colorMappings[colorClasses[i]] + ' ' + (percent * i) + "%";
            }
            cssBackgroundStr += "," + colorMappings[colorClasses[i]] + ' ' + divisions + "%";
        }
        cssBackgroundStr += ')';
        box.css('background', cssBackgroundStr);
    }
}

// TODO: remove if not used later
function addRepeatingLinearGradient(colorClasses, box) {
    const cssBrowserGradients = ['-webkit-', '-moz-', '-o-', '-ms-'];
    for (var j = 0; j < cssBrowserGradients.length; j++) {
        let cssBackgroundStr = cssBrowserGradients[j] + 'repeating-linear-gradient(135deg';

        const percent = 2;
        cssBackgroundStr += ',' + colorMappings[colorClasses[0]];
        for (var i = 0; i < colorClasses.length; i++) {
            // add additional color stop to create hard lines between colors
            if (i > 0 && i < colorClasses.length - 1) {
                cssBackgroundStr += "," + colorMappings[colorClasses[i]] + ' ' + (percent * i) + "%";
            }

            if (i !== colorClasses.length - 1) {
                cssBackgroundStr += "," + colorMappings[colorClasses[i]] + ' ' + (percent * (i + 1)) + "%";
            }
        }
        cssBackgroundStr += ')';
        box.css('background', cssBackgroundStr);
    }
}

function addColor(box, code) {
    box.css('background', ''); // clear existing gradients if they exist

    if (!box.hasClass('compulsory') && compulsoryCourseCodes.includes(code)) {
        box.addClass('compulsory');
    }

    var count = 0;
    for (var key in allMMSCourseCodes) {
        let className = MMS_CLASS_NAME + count;
        if (!box.hasClass(className) && allMMSCourseCodes[key].includes(code)) {
            box.addClass(className);
        }
        count++;
    }

    let existingClasses = box.attr('class').split(/\s+/);
    let colorClasses = existingClasses.filter(f => COLOR_CLASSES.includes(f));

    // create gradient for the card
    if (colorClasses.length > 1) addLinearGradient(colorClasses, box);
}

function makeElective(box, session, code) {
    box.popover('dispose');
    box.find('.course-code').text(ELECTIVE_TEXT);
    box.find('.course-title').text('');
    box.removeClass(COLOR_CLASSES_STR);
    makeSlotDroppable(box);
    PLAN.removeWarning('CourseForceAdded', code);
    PLAN.removeCourse(session, code);
}

// Make all cards in planner with matching code an elective
function removeCourseInPlanner(code) {
    for (let row of $('#plan-grid').find('.plan-row')) {
        const first_cell = $(row).find('.first-cell');
        const session = first_cell.find('.row-ses').text();
        $(row).children(".plan-cell").each(function () {
            const cellCode = $(this).find('.course-code').text();
            if (cellCode === code) {
                makeElective($(this), session, code);
            }
        });
    }
}

function addCourse(code, title, session, position) {
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-ses').text() === session);
    });
    removeCourseInPlanner(code);
    const box = $(row.children()[position + 1]);
    box.droppable('destroy');
    box.find('.course-code').text(code);
    box.find('.course-title').text(title);
    box.each(coursePopoverSetup);
    addColor(box, code);
    $.when(PLAN.addCourse(session, code).then(function () {
        updateProgress();
        updateRecommendations();
    }));
}

function removeCourse(session, position) {
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-ses').text() === session);
    });
    const box = $(row.children()[position]);
    const code = box.find('.course-code').text();
    box.removeClass(COLOR_CLASSES_STR);
    if (box.prevAll().hasClass('ui-sortable-placeholder')) position--;

    makeElective(box, session, code); // make the slot an elective slot and update planner 

    updateWarningNotices();
    updateProgress();
    updateRecommendations();
}

function toggleFilter(type, data) {
    if (SEARCH.getFilter(type, data)) deleteFilter(type, data);
    else addFilter(type, data);
}

function deleteFilter(type, data) {
    $('#filter-icons').find('.badge').filter(function (_, badge) {
        return $(badge).text().slice(0, -1) === SEARCH.getFilter(type, data).toString();
    }).remove();
    $($('#show-filters').data('bs.popover').tip).find('#filter-buttons button').filter(function (_, badge) {
        return $(badge).text() === data;
    }).removeClass('active');
    SEARCH.deleteFilter(type, data);
    search(true);
}

function addFilter(type, data) {
    const filter = SEARCH.addFilter(type, data);
    if (!filter) return; // Stop if filter is already present
    let filter_icon = $('<span class="badge badge-primary">' + filter + '</span>');
    let delete_button = $('<a class="filter-delete">×</a>');
    delete_button.click(function () {
        deleteFilter(type, data);
    });
    filter_icon.append(delete_button);
    $('#filter-icons').append(filter_icon, ' ');
    search(true);
}

// add color class for all cards in the search list
function colorSearchList() {
    $('#results-courses').find('.draggable-course').each(function () {
        var code = $(this).find('.course-code').text();
        addColor($(this), code);
    });
}

// add color class for the matching MMS card in planner
function colorPlannerCards() {
    for (let row of $('#plan-grid').find('.plan-row')) {
        $(row).children(".plan-cell").each(function () {
            var code = $(this).find('.course-code').text()
            addColor($(this), code);
        });
    }
}

// add color class for all cards in MMS lists
// async function colorMMSList() {
//    for (let list of $('#mms-active-list').find('.mms')) {
//        $(list).find('.draggable-course').each(function() {
//             console.log(code);
//             var code = $(this).find('.course-code').text();
//             addColor($(this), code);
//        });
//    }
// }

// return position of key in the MMS to course codes mapping
function getColorClassIndex(mmsCode) {
    var colorIndex = 0;
    for (var key in allMMSCourseCodes) {
        if (key === mmsCode) break;
        colorIndex++;
    }
    return colorIndex;
}

async function mms_add(code, year) {
    const mms = await getMMSOffering(code, year);
    PLAN.addMMS(code, year);
    let mms_active_list = $('#mms-active-list');
    let mms_card = $('<div class="mms card"/>');
    const identifier = code + '-' + year;
    let card_header = $(
        '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-active-' + identifier + '">\n' +
        '    <span class="mms-code">' + code + '</span>\n' +
        '    <span class="mms-year">' + year + '</span>\n' +
        '    <button class="mms-delete btn btn-danger" onclick="deleteMMS(this)">×</button>\n' +
        '    <span class="unit-count mr-2">0/' + mms.units + '</span>\n' +
        '    <strong>' + MMS_TYPE_PRINT[mms.type] + '</strong>: ' + mms.title + '\n' +
        '</div>');
    let collapsible = $(
        '<div id="mms-active-' + identifier + '" class="collapse show">' +
        '</div>'
    );
    collapsible.on('hide.bs.collapse', function () {
        $(this).find('.result-course').popover('hide');
    });
    // collapsible.sortable({
    //     items: "> .mms-select-min, .mms-select-max"
    // });

    let mmsCourseCodes = [];
    let colorIndex = getColorClassIndex(code);

    let courses_actions = {};
    let section_count = 0;
    let async_operations = [];
    let mms_to_retrieve = {};
    const required = mms.rules;

    function createCourseListSection(type, title, courses, counter = section_count) {
        let section = $('<div class="mms-internal card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-internal-' + identifier + '-section' + counter + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="mms-internal-' + identifier + '-section' + counter + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let group = $('<div class="list-group list-group-flush"/>');
        for (let code of courses) {
            code = code[0].code;
            let title_node = $('<span class="course-title"/>');
            let year_node = $('<span class="course-year"/>');
            if (!(code in courses_actions)) courses_actions[code] = [];
            courses_actions[code].push(function (offering) {
                title_node.text(offering.title);
                year_node.text(offering.year);
                makeCourseDraggable(item, code, offering.year);
            });
            let item = $(
                '<div class="list-group-item list-group-item-action compulsory draggable-course result-course">' +
                '    <span class="course-code">' + code + '</span> ' +
                '</div>'
            );
            item.addClass(MMS_CLASS_NAME + colorIndex);
            item.append(title_node);
            item.append(year_node);
            item.each(coursePopoverSetup);
            group.append(item);
        }
        collapsible.append(group);
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    function createCourseCategorySection(type, title, codes, levels) {
        let section = $('<div class="mms-internal card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-internal-' + identifier + '-section' + section_count + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="mms-internal-' + identifier + '-section' + section_count + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let description = '<div class="mms-internal-category-description">From ';
        if (levels && levels.length > 0) {
            for (let i in levels) {
                if (i > 0) description += '/ ';
                description += '<a href="javascript:void(0)" class="level-filter" onclick="addFilter(\'level\',\'' + levels[i] + '\')">' + levels[i] + '</a> ';
            }
        }
        description += 'courses starting with: ';
        for (let i in codes) {
            if (typeof(codes[i]) !== "string") continue;
            if (i > 0) description += ', ';
            description += '<a href="javascript:void(0)" class="code-filter" onclick="addFilter(\'code\',\'' + codes[i] + '\')">' + codes[i] + '</a>';
        }
        description = $(description + '</div>');
        collapsible.append(description);
        collapsible.append($('<div class="list-group list-group-flush"/>'));
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    for (let type in required) {
        if (!required.hasOwnProperty(type)) continue;
        mmsCourseCodes = Array.prototype.concat(mmsCourseCodes, required[type].courses || []);
        if (type === "compulsory_courses") {
            let card = createCourseListSection(type, "Compulsory courses", required[type]);
            collapsible.append(card);
            section_count++;
        }
        if (type === "one_from_here") {
            for (let section of required[type]) {
                let card = createCourseListSection(type, "Pick at least one", section);
                collapsible.append(card);
                section_count++;
            }
        }
        if (type === "x_from_here") {
            for (let section of required[type]) {
                let title = 'Choose at least ';
                if (section.type === "maximum") title = 'Choose up to ';
                title += (section.num || section.units) + ' units' +
                    '<span class="unit-count mr-2">0/' + (section.num || section.units) + '</span>\n';
                if (typeof(section['courses']) === "string") {
                    const name = section['courses'];
                    let placeholder = $('<div/>');
                    collapsible.append(placeholder);
                    const original_section_count = section_count;
                    section_count++;
                    if (name in KNOWN_COURSE_LISTS) {
                        let card = createCourseListSection(type, title, KNOWN_COURSE_LISTS[name], original_section_count);
                        placeholder.replaceWith(card);
                    } else {
                        async_operations.push($.ajax({
                            url: 'search/courselists',
                            data: {'query': name},
                            success: function (data) {
                                let courses = data.response.courses;
                                courses = courses.map(function (value, index, array) {
                                    if (typeof(value) !== "string") return value[0];
                                    else return value;
                                });
                                KNOWN_COURSE_LISTS[name] = courses;
                                if (data.response.type !== name) return;
                                let card = createCourseListSection(type, title, courses, original_section_count);
                                placeholder.replaceWith(card);
                            }
                        }));
                    }
                } else {
                    let card = createCourseListSection(type, title, section['courses']);
                    collapsible.append(card);
                    section_count++;
                }
            }
        }
        if (type === "x_from_category") {
            for (let section of required[type]) {
                let title = 'Choose at least ' + (section.num || section.units) + ' units' +
                    '<span class="unit-count mr-2">0/' + (section.num || section.units) + '</span>\n';
                if (section.type === "min_max") {
                    title = 'Choose between ' + section.units.minimum + ' and ' + section.units.maximum + ' units' +
                        '<span class="unit-count mr-2">0/' + section.units.minimum + '</span>\n';
                }
                let card = createCourseCategorySection(type, title, section['area'], section.level);
                collapsible.append(card);
                section_count++;
            }
        }
        if (type === "required_m/m/s") {
            for (let code of required[type]) {
                const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
                let mms_type = code.split('-').pop();
                let card = $('<div class="mms-internal deg-plain-text">\n' +
                    '    <span class="mms-code">' + code + '</span>\n' +
                    '    <strong>Compulsory ' + MMS_TYPE_PRINT[mms_type] + ':</strong>\n' +
                    '    <div id="deg-' + identifier + '-section' + section_count + '"></div>' +
                    '    <span class="unit-count mr-1">0/' + MMS_TYPE_UNITS[mms_type] + '</span>' +
                    '</div>');
                let title_node = $('<span/>');
                const mmsIdentifier = code + '/' + year;
                if (!(mmsIdentifier in mms_to_retrieve)) mms_to_retrieve[mmsIdentifier] = [];
                mms_to_retrieve[mmsIdentifier].push(function (mms) {
                    title_node.text(mms.title);
                    if (title_node.parent().hasClass('result-mms')) title_node.parent().each(mmsPopoverSetup);
                    async_operations.push(mms_add(code, year));
                });
                card.append(title_node);
                collapsible.append(card);
                section_count++;
            }
        }
    }

    mmsCourseCodes.concat.apply([], mmsCourseCodes);
    if (mmsCourseCodes.length !== 0) allMMSCourseCodes[code] = mmsCourseCodes;

    mms_card.append(card_header);
    mms_card.append(collapsible);
    if (mms_active_list.children().length === 0) $('#mms-list-placeholder').addClass('d-none');
    mms_active_list.prepend(mms_card);
    const collapse_button = $('.collapse-all');
    if (collapse_button.text() === 'Collapse all') collapse_button.click();
    else $.merge($('#degree-tabs-content').children(), $('#degree-reqs-list')).find('.collapse').collapse('hide');
    $(this).attr("disabled", true);
    $(this).text('Already in Plan');
    $.when.apply($, async_operations).then(function () {
        batchCourseOfferingActions(courses_actions);
        batchMMSData(mms_to_retrieve);
        updateProgress();
    });

    colorSearchList();
    colorPlannerCards();
}

async function deleteMMS(button) {
    const code = $(button).parent().find('.mms-code').text();
    const year = $(button).parent().find('.mms-year').text();
    let colorIndex = getColorClassIndex(code);
    delete allMMSCourseCodes[code];
    let mmsClassName = MMS_CLASS_NAME + colorIndex;
    $("." + mmsClassName).removeClass(mmsClassName); // remove the class from all elements
    PLAN.removeMMS(code, year); // Delete from the plan.
    $(button).parents('.mms').find('.result-course').popover('dispose');
    $(button).parents('.mms').remove();
    if ($('#mms-active-list').children().length === 0) $('#mms-list-placeholder').removeClass('d-none');
    updateProgress();
    colorSearchList();
    colorPlannerCards();
}

function closePopover(button) {
    $(button).parents('.popover').popover('hide');
}

async function updateClassColorMapping(colorClassName) {
    // create dummy element to retrieve class color
    let dummy = document.createElement('div');
    dummy.id = 'dummy';
    dummy.className = colorClassName;
    document.body.appendChild(dummy);
    colorMappings[colorClassName] = $('#dummy').css('backgroundColor'); // jquery here since javascript can't retrieve dynamic styling from css
    document.body.removeChild(dummy);
}

async function updateColorMappings() {
    COLOR_CLASSES.forEach(function (e) {
        updateClassColorMapping(e);
    });
}

// Startup Section
let CS = new CookieStore();
if (!(save_code)) { // Use the cookie if no save_code was given from the server.
    console.log('No save code provided, checking cookie. ');
    save_code = CS.getCode();
}

let PLAN = new Plan(start_year, start_sem);
let SEARCH = new Search(PLAN);
let SAVER = new AutoSave(PLAN, save_code);
setupPlanner();

updateColorMappings();

$('#rc-button').click(function () {
    $('#rc-modal').modal();
});

$('#save-button').click(function () {
    $('#save-code').text(save_code);
    $('#save-modal').modal();
});

$('#load-plan-button').click(function () {
    const code = $('#save-code-box').val().trim();
    if (!code) return;
    $('#code-wrong').hide();
    $.ajax({
        url: 'degree/stored_plans',
        method: 'GET',
        data: {"query": code},
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            save_code = code;
            CS.setCode(code);
            SAVER.code = code;
            $('#save-modal').modal('hide');
            $('#save-code-box').val("");
            clearPlanner();
            setupPlanner();
        },
        error: function (data) {
            if (data.responseJSON.response !== "no matching plan found") return;
            $('#code-wrong').show();
        }
    });
});

$('#degree-submit-success').find('button.close').click(function () {
    $('#degree-submit-success').addClass('d-none');
});

$('#load-failed-notice').find('button.close').click(function () {
    $('#load-failed-notice').addClass('d-none');
});

$('#confirm-clear-button').click(clearAllCourses);

$('#confirm-reset-button').click(resetPlan);

$('#add-course').on('keyup', function () {
    search();
});

$('.collapse').on('hide.bs.collapse', function () {
    $(this).find('.result-course').popover('hide');
});

$('#degree-selector').find('a').click(cycleDegrees);

$('#degree-tabs-content').find('.degree-body').sortable();

$('#degree-reqs-list').find('.degree-body').sortable();

$('.collapse-all').click(function () {
    if (this.textContent === "Collapse all") {
        $(this.parentElement.parentElement).find('.collapse').collapse('hide');
        $(this).text("Expand all")
    } else if (this.textContent === 'Expand all') {
        $(this.parentElement.parentElement).find('.collapse').collapse('show');
        $(this).text("Collapse all")
    }
});

$('#results-majors, #results-minors, #results-specs').on('hide.bs.collapse', function () {
    $(this).find('.result-mms').popover('hide');
});

$('#show-filters').popover({
    trigger: 'click',
    title: 'Add Filters <a class="popover-close" onclick="closePopover(this)">×</a>',
    placement: 'right',
    html: true,
    content: '<form onsubmit="return filterSubmit(this)">\n' +
    '<div class="form-row" style="padding: 0 5px">' +
    '<label for="code-input">Filter by code (e.g. MATH): </label></div>\n' +
    '<div class="form-row" style="padding: 0 5px">\n' +
    '    <div style="width: 100%; float:left; padding-right: 61px;"><input id="code-input" type="text" maxlength="4" class="form-control"></div>\n' +
    '    <button type="submit" class="btn btn-primary" style="float: left; margin-left: -56px;">Add</button>\n' +
    '</div>\n' +
    '<div class="form-row" style="padding: 0 5px"><label>Filter by level: </label></div>\n' +
    '<div id="filter-buttons" class="form-row">\n' +
    '    <div class="col-3"><button type="button" class="btn btn-outline-primary btn-sm">1000</button></div>\n' +
    '    <div class="col-3"><button type="button" class="btn btn-outline-primary btn-sm">2000</button></div>\n' +
    '    <div class="col-3"><button type="button" class="btn btn-outline-primary btn-sm">3000</button></div>\n' +
    '    <div class="col-3"><button type="button" class="btn btn-outline-primary btn-sm">4000</button></div>\n' +
    '</div>\n' +
    '<div class="form-row mt-2" style="padding: 0 5px">Filter per semester by clicking any elective course in your plan. </div>\n' +
    '</form>' +
    '',
    template: '<div class="popover filters-panel" role="tooltip">\n' +
    '    <div class="arrow"></div>\n' +
    '    <div class="h3 popover-header"></div>\n' +
    '    <div class="popover-body"></div>\n' +
    '    <a href="javascript:void(0)" class="popover-footer btn-outline-secondary text-center" onclick="$(\'#show-filters\').popover(\'hide\')">Close</a>\n' +
    '</div>'
}).on('shown.bs.popover', function () {
    const popover = $(this).data('bs.popover');
    const buttons = $(popover.tip).find('#filter-buttons button');
    for (const b of buttons) {
        $(b).on('click', function () {
            $(b).toggleClass('active');
            toggleFilter('level', $(b).text());
        });
        if (SEARCH.getFilter('level', $(b).text())) $(b).toggleClass('active');
    }
});

$('#mms-active-list').sortable();

$('#left-panel').find('a[data-toggle="tab"]').on('hide.bs.tab', function () {
    $('#left-panel').find('.result-course').popover('hide');
    $('#show-filters').popover('hide');
});

// Event Handlers
function cycleDegrees() {
    const direction = $(this).hasClass('right') * 2 - 1;
    const tabs = $('#degree-tabs');
    const activeTab = tabs.find('a.active');
    const newIndex = (activeTab.parent().index() + direction + 2) % 2; // Modulo 2 (expecting 2 tabs, add 2 to avoid negatives)
    const newTitle = $(tabs[0].children[newIndex]).find('a').text();
    $('#degree-selector .degree-selector-title').text(newTitle);
    $(activeTab.closest('ul').children()[newIndex]).find('a').tab('show');
}

function clickCell() {
    if ($(this).find('.course-code').text() === ELECTIVE_TEXT) {
        addFilter('session', $(this).parent().find('.first-cell .row-ses').text());
    }
}

function highlightElectives() {
    for (let cell of $('#plan-grid').find('.plan-cell')) {
        if ($(cell).find('.course-code').text() === ELECTIVE_TEXT) {
            $(cell).addClass("highlight-elective");
        }
    }
}

function clearElectiveHighlights() {
    for (let cell of $('#plan-grid').find('.plan-cell')) {
        $(cell).removeClass("highlight-elective");
    }
}

async function coursePopoverData(cell, descriptionOnly = false) {
    const code = $(cell).find('.course-code').text();
    const year = $(cell).find('.course-year').text();
    const me = cell;
    $(cell).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if (this !== me) $(this).popover('hide');
    });
    let popover = $(cell).data('bs.popover');
    if (popover['data-received'] || false) {
        return;
    }
    let curr_popover = $(popover.tip);
    let offering = await getCourseOffering(code, year);
    let html = '<div class="h6 result-title mb-1">' + offering.title + '</div>\n';
    if (![undefined, 'nan'].includes(offering.extras['description'])) {
        const truncated_description = offering.extras['description'].slice(0, 350) + '...';
        html += '<h6 class="mt-2">Description</h6>\n' +
            '<div class="result-description">' + truncated_description + '</div>\n';
    }
    if (!descriptionOnly) {
        const semesters = offering.extras['sessions'];
        if (![undefined, 'nan'].includes(semesters)) {
            if (semesters.length === 0) html += '<h6 class="mt-2">Not available in standard sessions</h6>';
            else html += '<h6 class="mt-2">Available in: ' + semesters.reduce((x, y) => x + ', ' + y) + '</h6>';
        }

        if (![undefined, 'nan'].includes(offering.extras['prerequisite_text'])) {
            html += '<h6 class="mt-2">Prerequisites and Incompatibility</h6>\n' +
                '<div class="result-description">' + offering.extras['prerequisite_text'] + '</div>\n';
        }
    }
    html += '<h6 class="mt-2">Related Courses</h6>\n';
    curr_popover.find('.popover-body').prepend('<div class="related-courses list-group"/>');
    curr_popover.find('.popover-body').prepend(html);

    const first_cell = $(cell.parentElement.firstElementChild);
    let session = year;
    if (first_cell.hasClass('first-cell')) session += first_cell.find('.row-ses').text().slice(4);
    else session += "S1"; // Placeholder session for courses which are not in the degree plan.
    let res = await $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': PLAN.degrees[0].code, // TODO: Fix for FDD recommendations
            'courses': JSON.stringify([{[session]: [{"code": code}]}])
        }
    });
    let courses_actions = {};
    let group = curr_popover.find('.related-courses');
    let recCourses = [];
    for (const clause of offering.rules) {
        for (const item of clause) {
            if (/^[A-Z]{4}[0-9]{4}/.test(item)) recCourses.push({
                'course': item,
                'reasoning': 'This is a prerequisite course.'
            });
        }
    }
    for (const course of res.response) {
        if (recCourses.map(x => x.course).includes(course.course)) continue;
        recCourses.push(course);
    }
    for (const course of recCourses) {
        const code = course.course;
        const reason = course.reasoning;

        let item = $(
            '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
            '    <span class="course-code">' + code + '</span>\n' +
            '</div>\n');
        let year_node = $('<span class="course-year"></span>');
        let title_node = $('<span class="course-title"></span>');
        if (!(code in courses_actions)) courses_actions[code] = [];
        courses_actions[code].push(function (offering) {
            title_node.text(offering.title);
            year_node.text(offering.year);
            makeCourseDraggable(item, code, offering.year);
        });
        item.append(title_node);
        item.append('<div class="course-reason">' + reason + '</div>');
        group.append(item);
    }
    await batchCourseOfferingActions(courses_actions);
    html += group[0].outerHTML;
    curr_popover.find('.fa-sync-alt').parent().removeClass('d-flex').addClass('d-none');
    popover.config.content = html;
    popover['data-received'] = true;
}

async function mmsPopoverData() {
    const code = $(this).find('.mms-code').text();
    const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
    $(this).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if ($(this).find('.mms-code').text() !== code) {
            $(this).popover('hide');
        }
    });
    let popover = $(this).data('bs.popover');
    let curr_popover = $(popover.tip);
    let add_button = curr_popover.find('button');
    if (PLAN.trackingMMS(code, year)) {
        add_button.attr("disabled", true);
        add_button.text('Already in Plan');
    } else {
        add_button.attr("disabled", false);
        add_button.text('Add to Plan');
    }

    if (popover['data-received'] || false) return;
    let offering = await getMMSOffering(code, year);
    let html = '';
    if (offering.extras['description']) {
        const truncated_description = offering.extras['description'].slice(0, 350) + '...';
        html += '<h6 class="mt-2">Description</h6>\n' +
            '<div class="result-description">' + truncated_description + '</div>\n';
    }
    if (offering.extras['learning_outcomes']) {
        const truncated_los = offering.extras['learning_outcomes'].slice(0, 350) + '...';
        html += '<h6 class="mt-2">Learning Outcomes</h6>\n' +
            '<div class="result-learning-outcomes">' + truncated_los + '</div>\n';
    }
    popover.config.content = html;
    curr_popover.find('.fa-sync-alt').css({'display': 'none'});
    curr_popover.find('.popover-body').append(html);
    popover['data-received'] = true;
    $('.mms-add button').click(mms_click_add);
}

function search(coursesOnly = false) {
    const query = $('#add-course').val();
    SEARCH.courseSearch(query, function () {
        searchResultsLoading(true, true)
    }, updateCourseSearchResults);
    if (coursesOnly) return;
    SEARCH.mmsSearch(query, function () {
        searchResultsLoading(true, false)
    }, updateMMSSearchResults);
}

function dropOnSlot(event, ui) {
    ui.draggable.draggable("option", "revert", false);
    $(this).removeClass('active-drop');
    makePlanCellDraggable($(event.target));
    const row = event.target.parentElement;
    const first_cell = $(row.firstElementChild);
    const code = ui.draggable.find('.course-code').text();
    const title = ui.draggable.find('.course-title').text();
    const session = first_cell.find('.row-ses').text();
    const position = $(event.target).index() - 1;
    if ($(row).hasClass('unavailable')) {
        const reason = $(first_cell[0].lastElementChild).text();
        let modal;
        if (reason === "Prerequisites not met") {
            $('#prereq-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#prereq-modal');
        } else if (reason.includes('Incompatible')) {
            $('#incompat-course1').text(ui.draggable.find('.course-code').text());
            $('#incompat-course2').text(reason.split(' ').pop());
            modal = $('#incompat-modal');
        } else if (reason === "Not available in this semester/ session") {
            $('#unavail-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#unavail-modal');
        }
        let override_button = modal.find('#course-add-override');
        override_button.off('click');
        override_button.click(function () {
            addCourse(code, title, session, position);
            PLAN.addWarning("CourseForceAdded", code, [makeScrollAndGlow($(event.target))]);
            updateWarningNotices();
        });
        modal.modal();
        return
    }
    addCourse(code, title, session, position);
}

function filterSubmit(form) {
    const input = $(form).find('input[type=text]');
    const code = input.val().toUpperCase();
    if (code && /^[A-Z]{4}$/.test(code) && !SEARCH.getFilter('code', code)) {
        addFilter('code', code);
        input.val('');
        input.css('background-color', '');
        input.css('color', '');
    } else {
        input.css('background-color', '#f8d7da');
        input.css('color', '#721c24');
        input.keydown(function () {
            $(this).css('background-color', '');
            $(this).css('color', '');
        })
    }
    return false;
}

async function mms_click_add() {
    const code = $(this).parents('.popover').attr('data-code');
    const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
    const mms = await getMMSOffering(code, year);
    if (PLAN.trackedMMS.includes(mms)) return;

    $('#search-results-list, #degree-reqs-list').find('.result-mms').each(function () {
        if ($(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    });
    mms_add(code, year)
}

// Event Functions
function clearPlanner() {
    PLAN = new Plan();  // Reset in case we are loading a plan on the user's request.
    SAVER.plan = PLAN;
    SEARCH.plan = PLAN;
    $('#plan-grid').empty();
    $.merge($('#degree-tabs-content').children(), $('#degree-reqs-list')).find('.degree-body').empty();
}

async function setupPlanner(ignoreSaveCode = false) {
    if (!save_code || ignoreSaveCode) {
        PLAN.startSem = start_sem;
        let startingDegree = await addDegree(degree_code, start_year);
        const singleReqsList = $('#degree-reqs-list');
        singleReqsList.hide();
        setupDegreeRequirements(singleReqsList.find('.degree-body'), startingDegree);

        if (degree_code2) await addDegree(degree_code2, start_year);
        else singleReqsList.show();

        let total_units = PLAN.degrees[0].units;
        if (PLAN.degrees[1]) total_units += PLAN.degrees[1].units;
        for (let i = 0; i < total_units / 24; i++) {
            PLAN.addSession(nextSession(start_year + 'S' + start_sem, i * 3));
        }
        setupGrid();
        loadCourseGrid(PLAN.degrees[0].suggestedPlan);
    }
    else { // Loading from save
        console.log('Loading found save code (' + save_code + ').');
        clearPlanner();
        let plan;
        try {
            plan = (await $.ajax({
                url: 'degree/stored_plans',
                method: 'GET',
                data: {"query": save_code},
                dataType: 'json',
                contentType: 'application/json'
            })).response;
        } catch (e) {
            if (e.responseJSON.response === "no matching plan found") {
                $('#load-failed-notice').removeClass('d-none');
            }
            save_code = undefined;
            SAVER.code = save_code;
            return setupPlanner();
        }
        start_year = plan.degrees[0].year;
        start_sem = plan.startSem;

        PLAN.startSem = plan.startSem;
        const degree = await addDegree(plan.degrees[0].code, plan.degrees[0].year);
        degree_code = degree.code;
        degree_name = degree.title;
        const singleReqsList = $('#degree-reqs-list');
        const multiReqsList = $('#degree-reqs');
        singleReqsList.hide();
        multiReqsList.hide();
        setupDegreeRequirements(singleReqsList.find('.degree-body'), degree);
        if (plan.degrees[1]) {
            multiReqsList.show();
            const degree2 = await addDegree(plan.degrees[1].code, plan.degrees[1].year);
            degree_code2 = degree2.code;
            degree_name2 = degree2.title;
        }
        else {
            singleReqsList.show();
            degree_code2 = degree_name2 = "";
        }
        for (const session of plan.sessions) PLAN.addSession(session);
        for (const mms of plan.trackedMMS) mms_add(mms.code, mms.year);
        setupGrid();
        loadCourseGrid(plan.courses);
        for (const warning of plan.warnings) {
            const actions = [];
            for (const action of warning.actions) { // Reconstruct the action functions
                if (action.type === "scroll-and-glow") {
                    const row = $('.plan-row').filter((_, x) => $(x).find('.row-ses').text() === action.session);
                    const target = row.children().filter((_, x) => $(x).find('.course-code').text() === action.code);
                    actions.push(makeScrollAndGlow($(target)));
                }
            }
            PLAN.addWarning(warning.type, warning.text, actions);
        }
        updateWarningNotices();
    }
}

function reorganiseDegreeTracker(double) {
    const reqs = $('#degree-reqs');
    const reqSingle = $('#degree-reqs-list');
    const tabsContent = $('#degree-tabs-content');
    if (double) {
        reqSingle.hide();
        reqs.show();
        reqSingle.find('.degree-body').children().appendTo($(tabsContent.children()[0]).find('.degree-body'));
        const headerUnitCount = $(tabsContent.children()[0]).find('.degree-header .unit-count');
        headerUnitCount.text(headerUnitCount.text().split('/')[0] + '/' + PLAN.degrees[0].units + ' units');
        setupDegreeRequirements($(tabsContent.children()[1]).find('.degree-body'), PLAN.degrees[1]);
        const tabs = $('#degree-tabs');
        for (const i in PLAN.degrees) {
            $(tabs.find('a')[i]).text(PLAN.degrees[i].title);
        }
        tabs.find('a').last().tab('show'); // Show the last (2nd) tab.
        $('.degree-selector-title').text(PLAN.degrees[1].title); // Show the title of the 2nd degree.
        if (degree_code2) $('#degree-selector').find('.nav-arrow.right').click(); // If starting with 2 degrees, go to the first tab.
    } else {
        reqs.hide();
        reqSingle.show();
        const degree = PLAN.degrees[0];
        for (const list of tabsContent.children()) {
            const identifier = $(list).find('.deg-identifier').text();
            if (degree.code + '-' + degree.year === identifier) {
                $(list).find('.degree-body').children().appendTo(reqSingle.find('.degree-body'));
                reqSingle.find('.degree-header .unit-count').text($(list).find('.degree-header .unit-count').text());
                $(list).empty();
            } else {
            }
        }
    }
}

function removeAddRows(row) {
    row.addClass('add-row-wrapper');

    if (row.next().hasClass('add-row-wrapper')) row = row.next();

    // remove all add rows
    for (var i = 0; i < 3 && row.hasClass('add-row-wrapper'); i++) {
        let prev = row.prev();
        row.remove();
        row = prev;
    }

    // return the row before the add chain
    return row;
}

function createRemoveSessionBtn(session, row) {
    let removeBtn = $('<button class="remove-row-btn"/>').append('<i class="fas fa-sm fa-minus-square"/>');
    let startSession = start_year + 'S' + start_sem;
    removeBtn.click(function () {
        $('.session-popover').popover('hide');
        let wrapper = $(this).parent();
        wrapper.addClass('remove-row-animate').on('transitionend', function (e) {
            if (session === PLAN.sessions[PLAN.sessions.length - 1]) {
                removeSession(session, row);
                let prev = removeAddRows(wrapper);

                if (PLAN.sessions.length === 0) { // only session in planner
                    $('#plan-grid').append(createAddSessionRow(startSession, true)); // start from the beginning
                } else $('#plan-grid').append(createAddSessionRow(nextSession(prev.find('.row-ses').text()), true));
            } else {
                removeSession(session, row);
                let prev = removeAddRows(wrapper);

                if (prev.length === 0) $('#plan-grid').prepend(createAddSessionRow(startSession, false));  // at first session in planner
                else prev.after(createAddSessionRow(nextSession(prev.find('.row-ses').text()), false));
            }

        });

    });
    return removeBtn;
}

function removeSession(session, row) {
    // remove existing courses in the session
    $(row).children(".plan-cell").each(function () {
        var cellCode = $(this).find('.course-code').text()
        if (cellCode !== ELECTIVE_TEXT) {
            PLAN.removeWarning('CourseForceAdded', cellCode);
            PLAN.removeCourse(session, cellCode);
        }
    });

    // update trackers
    updateWarningNotices();
    updateProgress();
    updateRecommendations();

    PLAN.removeSession(session);
}

// Return an empty session row for the planner of the given session
function createEmptySessionRow(session) {
    const year = session.slice(0, 4);
    const ses = session.slice(4);
    let row = $('<div class="plan-row"/>');
    let first_cell = '<div class="first-cell">' +
        '<div class="row-year h4">' + year + '</div>' +
        '<div class="row-sem h5">' + SESSION_WORDS[ses] + '</div>' +
        '<div class="row-ses">' + session + '</div>' +
        '</div>';
    row.append(first_cell);

    for (let i = 0; i < 4; i++) { // TODO: Fix for Overloading
        let cell = $('<div class="plan-cell result-course" tabindex="5"/>'); // Tabindex so we can have :active selector
        let title_node = $('<span class="course-title"/>');
        cell.append('<div class="course-code">' + ELECTIVE_TEXT + '</div>');
        cell.append('<div class="course-year">' + year + '</div>');
        cell.append(title_node);
        cell.click(clickCell);
        cell.each(coursePopoverSetup);
        makeSlotDroppable(cell);
        row.append(cell);
    }
    return row;
}

function createSessionRowEventListener(btn, session) {
    btn.click(function () {
        PLAN.addSession(session);
        let replacementDiv = $('<div class="plan-row-wrapper"/>');
        let row = createEmptySessionRow(session);
        let removeBtn = createRemoveSessionBtn(session, row);
        replacementDiv.append(removeBtn);
        replacementDiv.append(row);

        $(this).parent().addClass('add-row-animate').on('transitionend', function (e) {
            $(e.target).replaceWith(replacementDiv);
        });

    });
}

function createAddSessionBtn() {
    return $('<button class="add-row-btn"/>')
        .append('<i class="fas fa-sm fa-plus-square"/>');
}

function createNextSessionsPopover(addBtn, addRow, availableSessions, last) {
    addBtn.popover({
        trigger: 'click',
        title: 'Add Sessions<a class="popover-close" onclick="closePopover(this)">×</a>',
        placement: 'right',
        html: true,
        content: function () {
            let html = "";
            for (var i = 0; i < availableSessions.length; i++) {
                html += "<button class='btn session-popover-btn btn-outline-dark'" +
                    "data-toggle='button' aria-pressed='false' value='" + availableSessions[i] + "'>" +
                    availableSessions[i].slice(0, 4) + " " + SESSION_WORDS[availableSessions[i].slice(-2)] + "</button>";
            }
            return html;
        },
        template: '<div class="popover session-popover" data-container=".popover-body">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h2 popover-header"></div>\n' +
        '    <div class="popover-body session-popover-body"></div>\n' +
        '    <button class="btn session-popover-submit btn-success">Add</button>'
    }).on('shown.bs.popover', function (e) {
        $('.add-row-btn').not(this).popover('hide');
        let buttons = $('.session-popover').find('.session-popover-btn');
        let sessionsToAdd = {};
        let count = 0;
        for (var i = 0; i < availableSessions.length; i++) {
            sessionsToAdd[availableSessions[i]] = false;
        }

        // create toggle event for each button
        $(".session-popover-btn").click(function () {
            const session = $(this).val();
            if (!sessionsToAdd[session]) count++;
            else count--;
            sessionsToAdd[session] = !sessionsToAdd[session];
        });

        // add the selected sessions to the planner
        $(".session-popover-submit").click(function () {
            let sessionAdded = false;
            for (var j = availableSessions.length - 1; j >= 0; j--) {
                const addToPlanner = sessionsToAdd[availableSessions[j]];
                if (addToPlanner) {
                    PLAN.addSession(availableSessions[j]);
                    let row = createEmptySessionRow(availableSessions[j]);
                    let rowWrapper = $('<div class="plan-row-wrapper"/>');
                    rowWrapper.append(createRemoveSessionBtn(availableSessions[j], row));
                    rowWrapper.append(row);

                    // create additional add row if last option chosen
                    if (last && j === availableSessions.length - 1) {
                        addRow.after(createAddSessionRow(nextSession(availableSessions[j]), last));
                        last = false;
                    }

                    // create temp div to animate adding the wrapper
                    let temp = $("<div class='add-row-wrapper'/>");
                    addRow.after(temp);

                    // force the browser to render the transition
                    setTimeout(function () {
                        temp.addClass('add-row-animate').on('transitionend', function (e) {
                            $(e.target).replaceWith(rowWrapper);
                        });
                    }, 10);

                    sessionAdded = true;
                } else if (count > 0 && (j === 0 || sessionsToAdd[availableSessions[j - 1]])) { // create a new add row
                    addRow.after(createAddSessionRow(availableSessions[j], last));
                    last = false;
                }
            }

            if (sessionAdded) {
                addRow.remove();
                $('.session-popover').popover('hide');
            }
        });
    });
}

function getNextAvailableSessions(session, last) {
    let availableSessions = [];

    if (last) {
        for (var i = 0; i < NUM_ADD_SESSIONS_END; i++) {
            availableSessions.push(session);
            session = nextSession(session);
        }
    } else {
        while (!PLAN.sessions.includes(session)) {
            availableSessions.push(session);
            session = nextSession(session);
        }
    }

    return availableSessions;
}

function createAddSessionRow(session, last) {
    let addDiv = $('<div class="add-row-wrapper"/>');
    let addBtn = createAddSessionBtn();
    let availableSessions = getNextAvailableSessions(session, last);

    if (availableSessions.length > 1 || last) createNextSessionsPopover(addBtn, addDiv, availableSessions, last);
    else createSessionRowEventListener(addBtn, session);

    addDiv.append(addBtn);
    return addDiv;
}

function setupGrid() { // put the loaded plan's sessions in first before using this.
    let grid = $('#plan-grid');
    let startSession = start_year + 'S' + start_sem;
    if (PLAN.sessions.length === 0) grid.append(createAddSessionRow(startSession, true));
    else if (PLAN.sessions[0] !== start_year + 'S' + start_sem) grid.append(createAddSessionRow(startSession, false));
    for (var i = 0; i < PLAN.sessions.length; i++) {
        const year = PLAN.sessions[i].slice(0, 4);
        const ses = PLAN.sessions[i].slice(4);
        let row = $('<div class="plan-row"/>');
        let session_word = SESSION_WORDS[ses];
        let first_cell = '<div class="first-cell">' +
            '<div class="row-year h4">' + year + '</div>' +
            '<div class="row-sem h5">' + session_word + '</div>' +
            '<div class="row-ses">' + PLAN.sessions[i] + '</div>' +
            '</div>';
        row.append(first_cell);
        for (let i = 0; i < 4; i++) { // TODO: Fix for Overloading
            let cell = $('<div class="plan-cell result-course" tabindex="5"/>'); // Tabindex so we can have :active selector
            cell.append('<div class="course-code">' + ELECTIVE_TEXT + '</div>');
            cell.append('<div class="course-year">' + year + '</div>');
            cell.append('<div class="course-title" />');
            cell.click(clickCell);
            makeSlotDroppable(cell);
            row.append(cell);
        }
        grid.append(row);
        // create wrapper and button for removing a year/sem
        let rowWrapper = $('<div class="plan-row-wrapper"/>');

        rowWrapper.append(createRemoveSessionBtn(PLAN.sessions[i], row));
        rowWrapper.append(row);
        grid.append(rowWrapper);

        // create add buttons for last and seasonal sessions
        if (i === PLAN.sessions.length - 1) grid.append(createAddSessionRow(nextSession(PLAN.sessions[i]), true));
        else if (nextSession(PLAN.sessions[i]) !== PLAN.sessions[i + 1])
            grid.append(createAddSessionRow(nextSession(PLAN.sessions[i]), false));
    }
}

function loadCourseGrid(plan) {
    let rows = $('#plan-grid').find('.plan-row');
    let courses_actions = {};
    for (const session of PLAN.sessions) {
        const row = rows.filter((_, y) => $(y).find('.row-ses').text() === session);
        const year = session.slice(0, 4);
        let course_list = plan[session] || [];
        for (let i = 0; i < course_list.length; i++) {
            const code = course_list[i].code;
            if (!(/^[A-Z]{4}[0-9]{4}$/.test(code))) continue;
            let cell = $(row.children()[i + 1]);
            cell.find('.course-code').text(code);
            if (compulsoryCourseCodes.includes(code)) cell.addClass('compulsory');
            if (!((code + '-' + year) in courses_actions)) courses_actions[code + '-' + year] = [];
            courses_actions[code + '-' + year].push(function (offering) {
                cell.find('.course-title').text(offering.title);
                PLAN.addCourse(session, code);
            });
            cell.each(coursePopoverSetup);
            makePlanCellDraggable(cell);
            cell.droppable('destroy');
        }
    }
    batchCourseOfferingActions(courses_actions).then(function () {
        updateProgress();
        updateRecommendations();
        SAVER.enableSaving();
    });
}

function coursePopoverSetup(i, item) {
    const code = $(this).find('.course-code').text();
    const year = $(this).find('.course-year').text();
    if (code === ELECTIVE_TEXT) return;
    $(this).popover({
        trigger: 'click',
        title: code + '<a class="popover-close" onclick="closePopover(this)">×</a>',
        placement: 'right',
        html: true,
        content: '<div class="d-flex">\n' +
        '    <div class="fa fa-sync-alt fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover course-popover" role="tooltip">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '    <a href="https://programsandcourses.anu.edu.au/course/' + code +
        '     " class="h6 popover-footer text-center d-block" target="_blank">See More on Programs and Courses</a>\n' +
        '</div>'
    });

    $(this).on('show.bs.popover', function () {
        const popover = $(this).data('bs.popover');
        coursePopoverData(this, $(item).hasClass('plan-cell')).then(function () {
            setupRecommendations(popover);
        });
    });
    $(this).on('shown.bs.popover', function () {
        const popover = $(this).data('bs.popover');
        if (popover['data-received'] || false) setupRecommendations(popover);
    });

    async function setupRecommendations(popover) {
        const offering = await getCourseOffering(code, year);
        let prereqsSatisfied = false; // whether or not this course's prereqs are satisfied in any session in the plan.
        for (const session of PLAN.sessions) {
            prereqsSatisfied = prereqsSatisfied || offering.checkRequirements(PLAN, session).sat
        }
        const recommendations = $(popover.tip).find('.result-course');
        recommendations.each(coursePopoverSetup);
        for (const entry of recommendations) {
            const code = $(entry).find('.course-code').text();
            if (PLAN.getCourses(code).length) {
                $(entry).remove();
                continue;
            }
            const year = $(entry).find('.course-year').text();
            const reason = $(entry).find('.course-reason').text();
            if (reason === "This is a prerequisite course." && prereqsSatisfied) {
                $(entry).remove();
            }
            makeCourseDraggable($(entry), code, year);
        }
    }
}

function mmsPopoverSetup() {
    const name = $(this).find('.mms-name').text();
    const code = $(this).find('.mms-code').text();
    $(this).popover({
        trigger: 'click',
        title: name + '<a class="popover-close" onclick="closePopover(this)">×</a>',
        placement: 'right',
        html: true,
        content: '<div class="d-flex">\n' +
        '    <div class="fa fa-sync-alt fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover mms-popover" role="tooltip" data-code="' + code + '">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="mms-add"><button class="btn btn-info btn-sm btn-mms-add">Add to Plan</button></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '    <a href="https://programsandcourses.anu.edu.au/' + MMS_TYPE_PRINT[code.split('-')[1]].toLowerCase() + '/' + code +
        '     " class="h6 popover-footer text-center d-block" target="_blank">See More on Programs and Courses</a>\n' +
        '</div>'
    });
    $(this).on('show.bs.popover', mmsPopoverData)
}

function updateCourseSearchResults(response) {
    let results = $('#results-courses');
    let cbody = $(results.find('.card-body'));

    cbody.find('.result-course').popover('dispose');
    cbody.empty();

    if (response.length > 0) {
        for (let r of response.slice(0, 10)) {
            const code = r.code;
            const year = THIS_YEAR; // TODO: Fix for course years. Need the most recent year with data available.
            const title = r.title;
            let item = $(
                '<div class="draggable-course result-course list-group-item list-group-item-action">\n    ' +
                '<span class="course-code">' + code + '</span>\n    ' +
                '<span class="course-title">' + title + '</span>\n' +
                '</div>');
            addColor(item, code);
            makeCourseDraggable(item, code, year);
            item.each(coursePopoverSetup);
            cbody.append(item);
        }
    } else {
        cbody.append('<div class="m-2">No courses found.</div>');
    }
    searchResultsLoading(false, true);
    results.collapse('show');
    console.log('Course search successful');
}

function updateMMSSearchResults(data, type) {
    const section = $({
        'major': '#results-majors', 'minor': '#results-minors', 'specialisation': '#results-specs'
    }[type]);
    let body = section.find('.card-body');
    body.find('.result-mms').popover('dispose');
    body.empty();
    const responses = data.responses;
    if (responses.length > 0) {
        for (let r of responses) {
            const code = r.code;
            let name;
            for (const year in r.versions) { // TODO: Fix for MMS Years.
                name = r.versions[year].title;
                if (year == THIS_YEAR) break;
            }
            let item = $(
                '<div class="draggable-course result-mms list-group-item list-group-item-action">\n    ' +
                '<span class="mms-code">' + code + '</span>' +
                '<span class="mms-name">' + name + '</span>\n' +
                '</div>');
            item.each(mmsPopoverSetup);
            body.append(item);
        }
    } else body.append('<div class="m-2">No ' + type + 's found.</div>');
    searchResultsLoading(false, false);
    section.collapse('show');
    console.log(type + ' search successful')
}

function updateWarningNotices() {
    let notice = $('#courses-forced-notice');
    let list = $('#courses-forced-list');
    if (PLAN.warnings.length > 0) notice.css({'display': 'block'});
    else notice.css({'display': ''});
    list.empty();
    let count = 0;
    for (let warning of PLAN.warnings) {
        if (count !== 0) list.append(', ');
        if (warning.type === "CourseForceAdded") {
            let link = $('<a class="course-highlighter" href="javascript:void(0)">' + warning.text + '</a>');
            link.click(function () {
                warning.runActions();
            });
            list.append(link);
        }
        count++;
    }
}

function makeSlotDroppable(item) {
    item.droppable({
        accept: '.draggable-course',
        drop: dropOnSlot,
        over: function (event, ui) {
            item.addClass('active-drop');
        },
        out: function (event, ui) {
            item.removeClass('active-drop');
        }
    });
}

function makePlanCellDraggable(item) {
    item.draggable({
        zIndex: 800,
        revert: true,
        helper: 'clone',
        start: function (event, ui) {
            ui.helper.addClass('dragged-course');
            const first_cell = $(event.target.parentElement).find('.first-cell');
            first_cell.children().css({'display': 'none'});
            first_cell.addClass('delete').addClass('alert-danger');
            first_cell.append('<div class="course-delete mx-auto my-auto text-center" style="font-weight: bold;">\n' +
                '    <i class="fas fa-trash-alt" aria-hidden="true" style="font-size: 32pt;"></i>\n' +
                '    <div class="mt-2">Remove</div>\n' +
                '</div>');
            first_cell.droppable({
                accept: '.plan-cell',
                drop: function (event, ui2) {
                    ui2.draggable.draggable("option", "revert", false);
                    const session = first_cell.find('.row-ses').text();
                    const position = ui2.draggable.index();
                    removeCourse(session, position);
                    $(ui.helper.prevObject).draggable('destroy');
                    first_cell.droppable('destroy');
                    first_cell.find('.course-delete').remove();
                    first_cell.removeClass('delete').removeClass('alert-danger');
                    first_cell.children().css({'display': ''});
                }
            })
        },
        stop: function (event, ui) {
            const first_cell = $(event.target.parentElement).find('.first-cell');
            if (first_cell.hasClass('delete')) {
                first_cell.droppable('destroy');
                first_cell.find('.course-delete').remove();
                first_cell.removeClass('delete').removeClass('alert-danger');
                first_cell.children().css({'display': ''});
            }
        }
    });
}

function makeCourseDraggable(item, code, year) {
    item.draggable({
        zIndex: 800,
        revert: true,
        helper: 'clone',
        start: function (event, ui) {
            ui.helper.addClass('dragged-course');
            highlightInvalidSessions(getCourseOffering(code, year));
            highlightElectives();
        },
        stop: function (event, ui) {
            $(event.toElement).one('click', function (e) {
                e.stopImmediatePropagation();
            });
            removeSessionHighlights();
            clearElectiveHighlights();
            item.draggable("option", "revert", true);
        }
    });
}

function addRowCellsClass(row, css_class_name) {
    $(row).children(".plan-cell").each(function () {
        $(this).addClass(css_class_name);
    });
}

function removeRowCellsClass(row, css_class_name) {
    $(row).children(".plan-cell").each(function () {
        $(this).removeClass(css_class_name);
    });
}

async function highlightInvalidSessions(offering) {
    offering = await offering;
    let invalid_sessions = {};
    let offering_sessions = offering.extras.sessions;
    for (const session of PLAN.sessions) {
        const checked = offering.checkRequirements(PLAN, session);
        const offered = offering_sessions.includes(SESSION_WORDS[session.slice(4)]);
        if (!checked.sat) {
            if (checked.inc.length) invalid_sessions[session] = "Incompatible courses: " + checked.inc;
            else invalid_sessions[session] = "Prerequisites not met"
        }
        if (!offered) invalid_sessions[session] = "Not available in this semester/ session"
    }
    for (let row of $('#plan-grid').find('.plan-row')) {
        const first_cell = $(row.children[0]);
        const session = first_cell.find('.row-ses').text();
        if (!(session in invalid_sessions)) continue;

        const reason = invalid_sessions[session];
        $(row).addClass('unavailable', {duration: 500});
        first_cell.addClass('d-flex');
        first_cell.children().css({'display': 'none'});
        first_cell.append('<div class="h6 mx-auto my-auto">' + reason + '</div>');

        addRowCellsClass(row, 'invalid-cell');
    }
}

function removeSessionHighlights() {
    for (let row of $('#plan-grid').find('.plan-row')) {
        if (!$(row).hasClass('unavailable')) continue;
        const first_cell = $(row.children[0]);
        $(row).removeClass('unavailable', {duration: 500});
        first_cell.removeClass('d-flex');
        first_cell.children().css({'display': ''});
        while (first_cell.children().length > 3) first_cell.children().last().remove();
        removeRowCellsClass(row, 'invalid-cell');
    }
}

function setupDegreeRequirements(container, degree) {
    const identifier = degree.identifier;
    const required = degree.rules;
    let header = container.parent().find('.degree-header');
    let unit_count = header.find('.unit-count');
    unit_count.text("0/" + degree.units + " units");
    let courses_actions = {};
    let async_operations = [];
    let mms_to_retrieve = {};
    let mms_to_display = [];
    let section_count = 0;

    function createCourseListSection(type, title, courses, counter = section_count) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-' + identifier + '-section' + counter + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-' + identifier + '-section' + counter + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let group = $('<div class="list-group list-group-flush"/>');
        for (let code of courses) {
            let title_node = $('<span class="course-title"/>');
            let year_node = $('<span class="course-year"/>');
            if (!(code in courses_actions)) courses_actions[code] = [];
            courses_actions[code].push(function (offering) {
                title_node.text(offering.title);
                year_node.text(offering.year);
                makeCourseDraggable(item, code, offering.year);
            });
            let item = $(
                '<div class="list-group-item list-group-item-action compulsory draggable-course result-course">' +
                '    <span class="course-code">' + code + '</span> ' +
                '</div>'
            );
            compulsoryCourseCodes.push(code);
            item.append(title_node);
            item.append(year_node);
            item.each(coursePopoverSetup);
            group.append(item);
        }
        collapsible.append(group);
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    function createCourseCategorySection(type, title, codes, levels) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-' + identifier + '-section' + section_count + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-' + identifier + '-section' + section_count + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let description = '<div class="deg-category-description">From ';
        if (levels && levels.length > 0) {
            for (let i in levels) {
                if (i > 0) description += '/ ';
                description += '<a href="javascript:void(0)" class="level-filter" onclick="addFilter(\'level\',\'' + levels[i] + '\')">' + levels[i] + '</a> ';
            }
        }
        description += 'courses starting with: ';
        for (let i in codes) {
            if (typeof(codes[i]) !== "string") continue;
            if (i > 0) description += ', ';
            description += '<a href="javascript:void(0)" class="code-filter" onclick="addFilter(\'code\',\'' + codes[i] + '\')">' + codes[i] + '</a>';
        }
        description = $(description + '</div>');
        collapsible.append(description);
        collapsible.append($('<div class="list-group list-group-flush"/>'));
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    function createMMSListSection(type, title, mms) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-' + identifier + '-section' + section_count + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-' + identifier + '-section' + section_count + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-mms').popover('hide');
        });

        let group = $('<div class="list-group list-group-flush"/>');
        for (let code of mms) {
            const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
            let title_node = $('<span class="mms-name"/>');
            const identifier = code + '/' + year;
            if (!(identifier in mms_to_retrieve)) mms_to_retrieve[identifier] = [];
            mms_to_retrieve[identifier].push(function (mms) {
                title_node.text(mms.title);
                if (title_node.parent().hasClass('result-mms')) title_node.parent().each(mmsPopoverSetup);
            });
            let item = $(
                '<div class="list-group-item list-group-item-action result-mms">' +
                '    <span class="mms-code">' + code + '</span> ' +
                '</div>'
            );
            item.append(title_node);
            group.append(item);
        }
        collapsible.append(group);
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    container.append('<div class="deg-identifier">' + degree.code + '-' + degree.year + '</div>');
    for (let type in required) {
        if (!required.hasOwnProperty(type)) continue;
        if (type === "compulsory_courses") {
            let card = createCourseListSection(type, "Compulsory courses", required[type]);
            container.append(card);
            section_count++;
        }
        if (type === "one_from_here") {
            for (let section of required[type]) {
                let card = createCourseListSection(type, "Pick at least one", section);
                container.append(card);
                section_count++;
            }
        }
        if (type === "x_from_here") {
            for (let section of required[type]) {
                let title = 'Choose at least ' + (section.num || section.units) + ' units' +
                    '<span class="unit-count mr-2">0/' + (section.num || section.units) + '</span>\n';
                if (typeof(section['courses']) === "string") {
                    const name = section['courses'];
                    let placeholder = $('<div/>');
                    container.append(placeholder);
                    const original_section_count = section_count;
                    section_count++;
                    if (name in KNOWN_COURSE_LISTS) {
                        let card = createCourseListSection(type, title, KNOWN_COURSE_LISTS[name], original_section_count);
                        placeholder.replaceWith(card);
                    } else {
                        async_operations.push($.ajax({
                            url: 'search/courselists',
                            data: {'query': name},
                            success: function (data) {
                                let courses = data.response.courses;

                                courses = courses.map(function (value, index, array) {
                                    if (typeof(value) !== "string") return value[0];
                                    else return value;
                                });
                                KNOWN_COURSE_LISTS[name] = courses;
                                if (data.response.type !== name) return;
                                let card = createCourseListSection(type, title, courses, original_section_count);
                                placeholder.replaceWith(card);
                            }
                        }));
                    }
                } else {
                    let card = createCourseListSection(type, title, section['courses']);
                    container.append(card);
                    section_count++;
                }
            }
        }
        if (type === "x_from_category") {
            for (let section of required[type]) {
                let title = 'Choose at least ' + (section.num || section.units) + ' units' +
                    '<span class="unit-count mr-2">0/' + (section.num || section.units) + '</span>\n';
                if (section.type === "min_max") {
                    title = 'Choose between ' + section.units.minimum + ' and ' + section.units.maximum + ' units' +
                        '<span class="unit-count mr-2">0/' + section.units.minimum + '</span>\n';
                }
                let card = createCourseCategorySection(type, title, section['area'], section.level);
                container.append(card);
                section_count++;
            }
        }
        if (type === "required_m/m/s") {
            for (let code of required[type]) {
                const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
                let mms_type = code.split('-').pop();
                let card = $('<div class="deg deg-plain-text">\n' +
                    '    <span class="mms-code">' + code + '</span>\n' +
                    '    <strong>Compulsory ' + MMS_TYPE_PRINT[mms_type] + ':</strong>\n' +
                    '    <div id="deg-' + identifier + '-section' + section_count + '"></div>' +
                    '    <span class="unit-count mr-1">0/' + MMS_TYPE_UNITS[mms_type] + '</span>' +
                    '</div>');
                let title_node = $('<span/>');
                const mmsIdentifier = code + '/' + year;
                if (!(mmsIdentifier in mms_to_retrieve)) mms_to_retrieve[mmsIdentifier] = [];
                mms_to_retrieve[mmsIdentifier].push(function (mms) {
                    title_node.text(mms.title);
                    if (title_node.parent().hasClass('result-mms')) title_node.parent().each(mmsPopoverSetup);
                    if (mms_to_display.includes(code)) async_operations.push(mms_add(code, year));
                    // Make this M/M/S undeletable.
                    $('#mms-active-list').find('.mms-code').each(function () {
                        if ($(this).text() === code) {  // TODO: Fix for MMS years. Should this be undeletable?
                            // This is also making any other years of this MMS undeletable.
                            $(this).parent().find('.mms-delete').remove();
                        }
                    });
                });
                mms_to_display.push(code);
                card.append(title_node);
                container.append(card);
                section_count++;
            }
        }
        if (type === "one_from_m/m/s") {
            for (let section of required[type]) {
                let card = createMMSListSection(type, "Complete one of these majors, minors, or specialisations", section);
                container.append(card);
                section_count++;
            }
        }
        if (type === "max_by_level") {
            for (let section of required[type]) {
                if (section.type === "maximum") {
                    let limit = section.units;
                    let level = section.level;
                    let card = $('<div class="deg deg-plain-text">\n' +
                        '    <div id="deg-' + identifier + '-section' + section_count + '"></div>\n' +
                        '    <span class="unit-count mr-1">0/' + limit + '</span>' +
                        '    At most ' + limit + ' units of ' + level + '-level courses\n' +
                        '</div>');
                    container.append(card);
                    section_count++;
                } // TODO: Handle minimum sections
            }
        }
    }
    $.when.apply($, async_operations).then(function () {
        batchCourseOfferingActions(courses_actions);
        batchMMSData(mms_to_retrieve);
        updateProgress();
    })
}

function updateMMSTrackers() {
    for (const mms of PLAN.trackedMMS) {
        const mms_card = $('#mms-active-list').find('#mms-active-' + mms.identifier).parent();
        const results = mms.checkRequirements(PLAN);
        for (const i in results.rule_details) { // TODO: Fix for Optional Sections
            const details = results.rule_details[i];
            const type = details.type;
            const card = mms_card.find('#mms-internal-' + mms.identifier + '-section' + i).parent();
            let section_status = "";
            if (["compulsory_courses", "one_from_here", "x_from_here"].includes(type)) {
                for (const c of card.find('.result-course')) {
                    const code = $(c).find('.course-code').text();
                    setChecked($(c), details.codes.includes(code), type === 'compulsory_courses');
                }
                section_status = details.sat ? 'done' : 'incomplete';
            }
            else if (["x_from_category", "max_by_level"].includes(type)) {
                const group = card.find('.list-group');
                group.empty();
                for (const code of details.codes) {
                    getCourseOffering(code, THIS_YEAR).then(function (offering) { // Get most appropriate offering
                        const item = $(
                            '<div class="list-group-item list-group-item-action result-course inc">' +
                            '    <span class="course-code">' + code + '</span> ' +
                            '    <span class="course-year">' + offering.year + '</span> ' +
                            '    <span class="course-title">' + offering.title + '</span>' +
                            '</div>'
                        );
                        item.each(coursePopoverSetup);
                        group.append(item);
                    });
                }
                section_status = details.sat ? 'done' : (type === "max_by_level" ? 'problem' : 'incomplete');
            }
            else if (["required_m/m/s", "one_from_m/m/s"].includes(type)) {
                for (const entry of card.find('.mms-code')) {
                    const code = $(entry).text();
                    if (details.completed.includes(code)) {
                        $(entry).parent().addClass('inc').removeClass('partial');
                    } else if (details.codes.includes(code)) {
                        $(entry).parent().addClass('partial').removeClass('inc')
                    } else $(entry).parent().removeClass('inc partial');
                }
                if (details.sat) section_status = 'done';
                else if (details.codes.length) section_status = 'incomplete';
                else section_status = 'problem'
            }
            if (details.units !== undefined) updateUnitCount(card.find('.unit-count'), details.units);
            setPanelStatus(card, section_status);
        }
        updateUnitCount($(mms_card[0].firstElementChild).find('.unit-count'), results.units);
        setPanelStatus(mms_card, results.sat ? 'done' : 'incomplete');
    }
}

async function updateDegreeTrackers() {
    const trackers = $.merge($('#degree-tabs-content').children(), $('#degree-reqs-list')); // Order matters
    let overall_sat = true;
    for (let i = 0; i < trackers.length; i++) {
        const reqList = $(trackers[i]);
        const identifier = reqList.find('.deg-identifier').text();
        if (PLAN.degrees[i % 2] === undefined) continue;
        const results = PLAN.degrees[i % 2].checkRequirements(PLAN); // Order above matters so that this degree retrieval works.
        for (const i in results.rule_details) { // TODO: Fix for Optional Sections
            const details = results.rule_details[i];
            const type = details.type;
            const card = reqList.find('#deg-' + identifier + '-section' + i).parent();
            let section_status = "";
            if (["compulsory_courses", "one_from_here", "x_from_here"].includes(type)) {
                for (const c of card.find('.result-course')) {
                    const code = $(c).find('.course-code').text();
                    setChecked($(c), details.codes.includes(code), type === 'compulsory_courses');
                }
                section_status = details.sat ? 'done' : 'incomplete';
            }
            else if (["x_from_category", "max_by_level"].includes(type)) {
                const group = card.find('.list-group');
                group.empty();
                for (const code of details.codes) {
                    const offering = await getCourseOffering(code, THIS_YEAR); // Get most appropriate offering
                    const item = $(
                        '<div class="list-group-item list-group-item-action result-course inc">' +
                        '    <span class="course-code">' + code + '</span> ' +
                        '    <span class="course-year">' + offering.year + '</span> ' +
                        '    <span class="course-title">' + offering.title + '</span>' +
                        '</div>'
                    );
                    item.each(coursePopoverSetup);
                    group.append(item);
                }
                section_status = details.sat ? 'done' : (type === "max_by_level" ? 'problem' : 'incomplete');
            }
            else if (["required_m/m/s", "one_from_m/m/s"].includes(type)) {
                for (const entry of card.find('.mms-code')) {
                    const code = $(entry).text();
                    if (details.completed.includes(code)) {
                        $(entry).parent().addClass('inc').removeClass('partial');
                    } else if (details.codes.includes(code)) {
                        $(entry).parent().addClass('partial').removeClass('inc')
                    } else $(entry).parent().removeClass('inc partial');
                }
                if (details.sat) section_status = 'done';
                else if (details.codes.length) section_status = 'incomplete';
                else section_status = 'problem'
            }
            if (details.units !== undefined) updateUnitCount(card.find('.unit-count'), details.units);
            setPanelStatus(card, section_status);
        }
        updateUnitCount(reqList.find('.degree-header .unit-count'), results.units);
        overall_sat = overall_sat && results.sat;
    }
    $('#degree-completed-notice').css({'display': overall_sat ? 'block' : ''});
}

function updateUnitCount(counter, value) {
    counter.text(value + '/' + counter.text().split('/')[1]);
}

function setChecked(node, checked, useCrosses) {
    if (checked) {
        node.addClass('inc');
        if (useCrosses) node.removeClass('exc');
    } else {
        node.removeClass('inc');
        if (useCrosses) node.addClass('exc');
    }
}

function setPanelStatus(panel, status) {
    if (status === 'done') {                // Done
        panel.addClass('alert-success');
        panel.removeClass('alert-warning alert-danger');
    } else if (status === 'incomplete') {   // Incomplete
        panel.addClass('alert-warning');
        panel.removeClass('alert-success alert-danger');
    } else if (status === 'problem') {      // Problem
        panel.addClass('alert-danger');
        panel.removeClass('alert-success alert-warning');
    } else panel.removeClass('alert-success alert-warning alert-danger');
}

function updateProgress() {
    updateMMSTrackers();
    updateDegreeTrackers();
}

async function updateRecommendations() {
    let group = $('#degree-recommendations-list');
    let res = {};
    try {
        await $.ajax({
            url: 'recommendations/recommend',
            data: {
                'code': PLAN.degrees[0].code, // TODO: Fix for FDD Recommendations
                'courses': JSON.stringify(preparePlanForUpload(PLAN))
            },
            success: function (data) {
                res = data;
            }
        });
    } catch (e) {
        if (e.statusText === "Internal Server Error") {
            group.text('No recommendations could be made.');
        }
        return;
    }

    let courses_actions = {};
    group.find('.result-course').popover('dispose');
    group.empty();
    for (const course of res.response) {
        const code = course.course;
        const reason = course.reasoning;

        let item = $(
            '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
            '    <span class="course-code">' + code + '</span>\n' +
            '</div>\n');
        let title_node = $('<span class="course-title"></span>');
        let year_node = $('<span class="course-year"></span>');
        if (!(code in courses_actions)) courses_actions[code] = [];
        courses_actions[code].push(function (offering) {
            title_node.text(offering.title);
            year_node.text(offering.year);
            makeCourseDraggable(item, code, offering.year);
        });
        item.append(title_node);
        item.append(year_node);
        item.append('<div class="course-reason">' + reason + '</div>');
        item.each(coursePopoverSetup);
        group.append(item);
        addColor(item, code);
    }
    await batchCourseOfferingActions(courses_actions);
}

/**
 * Show or hide loading indicators in the search results panels.
 * @param show  true to show indicators, false to hide indicators.
 * @param courses   true to change the course results, false to change the MMS ones.
 */
function searchResultsLoading(show, courses) {
    const resultsLists = $('#search-results-list').children();
    const courseResultsList = resultsLists.first();
    const mmsResultsList = resultsLists.not(':first');
    const cDisplay = {true: 'none', false: ''};
    const rDisplay = {true: 'inline-block', false: 'none'};
    if (courses) {
        courseResultsList.find('.collapse').css({'display': cDisplay[show]});
        courseResultsList.find('.fa-sync-alt').css({'display': rDisplay[show]});
    } else {
        mmsResultsList.find('.collapse').css({'display': cDisplay[show]});
        mmsResultsList.find('.fa-sync-alt').css({'display': rDisplay[show]});
    }
}

function makeScrollAndGlow(target) {
    let action = function () {
        $([document.documentElement, document.body]).animate({
            scrollTop: target.offset().top - $(window).height() * 3 / 10
        }, 500);
        target.animate({boxShadow: '0 0 25px #007bff'});
        target.animate({boxShadow: '0 0 0px #007bff'});
    };
    action.target = target;
    return action;
}
