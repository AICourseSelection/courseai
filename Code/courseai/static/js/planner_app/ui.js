// Reference Constants
SESSION_WORDS = {
    'Su': 'Summer Session',
    'S1': 'Semester 1',
    'Au': 'Autumn Session',
    'Wi': 'Winter Session',
    'S2': 'Semester 2',
    'Sp': 'Spring Session'
};

// UI Functions
async function addDegree(code, year) {
    let add = await PLAN.addDegree(code, year);
    if (!add) console.log("Tried to add degree " + code + " (" + year + "), already present.");
    const titleText = PLAN.degrees.reduce((d1, d2) => d1.title + ' and ' + d2.title);
    $('#degree-title-text').text(titleText);
}

function clearAllCourses() {
    PLAN.clearAllCourses();

    for (let box of $('#plan-grid').find('.plan-cell')) {
        $(box).popover('dispose');
        makeSlotDroppable($(box));
        $(box).find('.course-code').text(ELECTIVE_TEXT);
        $(box).find('.course-title').text('');
    }

    //TODO: Call 'UpdateProgress'
}

function addCourse(code, title, session, position, update_recommendations = true) {
    PLAN.addCourse(session, code);
    const year = session.split('S')[0];
    const sem = 'Semester ' + session.split('S')[1];
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() == year && first_cell.find('.row-sem').text() == sem);
    });
    const box = $(row.children()[position + 1]);
    box.droppable('destroy');
    box.find('.course-code').text(code);
    box.find('.course-title').text(title);
    box.each(coursePopoverSetup);
    // TODO: Call UpdateProgress
    if (update_recommendations) updateRecommendations();
}

// Startup Section
let PLAN = new Plan();
addDegree(degree_code, start_year);
let total_units = PLAN.degrees.reduce((x, y) => (x.totalUnits - 48) + (y.totalUnits - 48));
for (let i = 0; i <= total_units / 24; i++) {
    PLAN.addSession(nextSession(start_year + 'S' + start_sem, i));
}

let titles_fill_nodes = {};
for (const plan_section of PLAN.degrees[0].suggestedPlan) { //TODO: Fix for FDDs
    for (const session in plan_section) {
        if (!plan_section.hasOwnProperty(session)) continue;
        const year = session.slice(0, 4);
        const ses = session.slice(4);
        let first_cell = '<div class="first-cell">' +
            '<div class="row-year h4">' + year + '</div>' +
            '<div class="row-sem h5">' + SESSION_WORDS[ses] + '</div>' +
            '</div>';
        let row = $('<div class="plan-row"/>');
        if (ses === 'Semester 1') row.addClass('mt-3'); //TODO: Fix for Summer Sessions
        row.append(first_cell);

        let course_list = plan_section[session];
        for (const course of course_list) {
            PLAN.addCourse(session, course.code);
            let cell = $('<div class="plan-cell result-course" tabindex="' + tab_index_count + '"/>');
            tab_index_count++;
            let title_node = $('<span class="course-title"/>');
            if (false && course['title'] !== undefined) {   // Ignore the degree's own titles for now
                title_node.text(course['title']);
            } else if (course.code !== ELECTIVE_TEXT) {
                if (!(course.code in titles_fill_nodes)) titles_fill_nodes[course.code] = [];
                titles_fill_nodes[course.code].push(function (title) {
                    title_node.text(title);
                });
            }
            cell.append('<div class="course-code">' + course['code'] + '</div>');
            cell.append(title_node);
            cell.click(clickCell);
            cell.each(coursePopoverSetup);
            if (course['code'] === ELECTIVE_TEXT) makeSlotDroppable(cell);
            row.append(cell);
        }

        row.sortable({
            items: "> .plan-cell",
            start: function (event, ui) {
                if (ui.item.find('.course-code').text() === ELECTIVE_TEXT) return;
                const first_cell = $(event.target).find('.first-cell');
                first_cell.children().css({'display': 'none'});
                first_cell.addClass('delete').addClass('alert-danger');
                first_cell.append('<div class="course-delete mx-auto my-auto text-center" style="font-weight: bold;">\n' +
                    '    <i class="fas fa-trash-alt" aria-hidden="true" style="font-size: 32pt;"></i>\n' +
                    '    <div class="mt-2">Remove</div>\n' +
                    '</div>');
                first_cell.droppable({
                    accept: '.plan-cell',
                    drop: function (event, ui) {
                        console.log('delete');
                        const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
                        const position = ui.draggable.index();
                        removeCourse(session, position);
                        first_cell.droppable('destroy');
                        first_cell.children().last().remove();
                        first_cell.removeClass('delete').removeClass('alert-danger');
                        first_cell.children().css({'display': 'block'});
                    }
                })
            },
            stop: function (event, ui) {
                const first_cell = $(event.target).find('.first-cell');
                if (first_cell.hasClass('delete')) {
                    first_cell.droppable('destroy');
                    first_cell.children().last().remove();
                    first_cell.removeClass('delete').removeClass('alert-danger');
                    first_cell.children().css({'display': 'block'});
                }

                const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
                for (let i in degree_plan[session]) {
                    let course_slot = degree_plan[session][i];
                    let cell = $(event.target.children[parseInt(i) + 1]);
                    course_slot['code'] = cell.find('.course-code').text();
                    course_slot['title'] = cell.find('.course-title').text();
                }
            }
        });
        grid.append(row);
    }
}
batchCourseTitles(titles_fill_nodes);

let title_box = $('#degree-title');
let rc_button = $('#rc-button');
title_box.hover(function () {
    rc_button.fadeIn(150);
}, function () {
    rc_button.fadeOut(150);
});

rc_button.click(function () {
    $('#rc-modal').modal();
});

$('#upload-button').click(function () {
    $('#upload-modal').modal();
});

$('#confirm-upload-button').click(function () {
    $.ajax({
        type: 'PUT',
        url: 'degree/degreeplan',
        data: JSON.stringify({
            "code": degree_code,
            "courses": preparePlanForUpload(degree_plan)
        }),
        headers: {
            "Content-Type": "application/json"
        },
        success: function () {
            $('#degree-submit-success').removeClass('d-none');
        },
        error: function () {
            $('#degree-title').after('<div class="alert alert-danger alert-dismissible fade show mx-auto mb-0" role="alert">\n' +
                '  Could not submit degree plan. Please try again. \n' +
                '  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\n' +
                '    <span aria-hidden="true">&times;</span>\n' +
                '  </button>\n' +
                '</div>');
        }
    })
});

$('#degree-submit-success').find('button.close').click(function () {
    $('#degree-submit-success').addClass('d-none');
});


$('#confirm-clear-button').click(clearAllCourses);

$('#confirm-reset-button').click(function () {
    $.ajax({
        url: 'degree/degreeplan',
        data: {
            'query': degree_code,
            'start_year_sem': start_year + 'S' + start_sem
        },
        success: function (data) {
            clearAllCourses();
            let course_dict = data['response'];
            for (let row of course_dict) {
                let session = Object.keys(row)[0];
                let courses = row[session];
                for (let i in courses) {
                    let c = courses[i];
                    addCourse(c.code, course_titles[c.code], session, parseInt(i), false);
                }
            }
            updateRecommendations();
        }
    });
});

// Event Handlers
function electiveDropped(event, ui) {
    const row = event.target.parentElement;
    const first_cell = $(row.firstElementChild);
    const code = ui.draggable.find('.course-code').text();
    const title = ui.draggable.find('.course-title').text();
    const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
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
        } else if (reason === "Not available in this semester") {
            $('#unavail-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#unavail-modal');
        }
        let override_button = modal.find('#course-add-override');
        override_button.off('click');
        override_button.click(function () {
            addCourse(code, title, session, position);
            courses_force_added[code] = $(event.target);
            updateForceNotice();
        });
        modal.modal();
        return
    }
    addCourse(code, title, session, position);
}

// Event Functions
function updateRecommendations() {
    let group = $('#degree-recommendations-list');
    $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify(preparePlanForUpload(degree_plan))
        },
        success: function (data) {
            let titles_to_retrieve = {};
            group.find('.result-course').popover('dispose');
            group.empty();
            for (const course of data.response) {
                const code = course.course;
                const reason = course.reasoning;

                let item = $(
                    '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
                    '    <span class="course-code">' + code + '</span>\n' +
                    '</div>\n');
                let title_node = $('<span class="course-title"></span>');
                if (code in course_titles) title_node.text(course_titles[code]);
                else {
                    if (!(code in titles_to_retrieve)) titles_to_retrieve[code] = [];
                    titles_to_retrieve[code].push(title_node);
                }
                item.append(title_node);
                item.append('<div class="course-reason">' + reason + '</div>');
                makeCourseDraggable(item, code);
                item.each(coursePopoverSetup);
                group.append(item);
            }
            if (!jQuery.isEmptyObject(titles_to_retrieve)) {
                $.ajax({
                    'url': 'degree/coursedata',
                    data: {
                        'query': 'titles',
                        'codes': JSON.stringify(Object.keys(titles_to_retrieve))
                    },
                    success: function (data) {
                        for (let course of data.response) {
                            course_titles[course['course_code']] = course['title'];
                            for (node of titles_to_retrieve[course['course_code']]) {
                                node.text(course['title']);
                                let popover = node.parents('.result-course').data('bs.popover');
                                const new_content = $($(popover.config.content)[0]).text(course['title']);
                                popover.config.content = new_content.prop('outerHTML');
                            }
                        }
                    }
                });
            }
        }
    })
}

function updateForceNotice() {
    let notice = $('#courses-forced-notice');
    let list = $('#courses-forced-list');
    if (Object.keys(courses_force_added).length > 0) notice.css({'display': 'block'});
    else notice.css({'display': ''});
    list.empty();
    let count = 0;
    for (let course in courses_force_added) {
        if (count !== 0) list.append(', ');
        let link = $('<a class="course-highlighter" href="javascript:void(0)">' + course + '</a>');
        link.click(function () {
            courses_force_added[course].animate({boxShadow: '0 0 25px #007bff'});
            courses_force_added[course].animate({boxShadow: ''});
        });
        list.append(link);
        count++;
    }
}
