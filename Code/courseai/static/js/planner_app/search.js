function Search(plan) {
    this.plan = plan;
    this.requests = {
        'course': null,
        'major': null,
        'minor': null,
        'spec': null
    };
    this.filters = [];

    this.courseSearch = function (query, before, after) {
        const plan = this.plan;
        if (this.requests['course'] !== null) this.requests['course'].abort();
        let activeFilters = this.filters;
        let filters = {
            'codes': [],
            'levels': [],
            'semesters': [],
        };
        for (let f of activeFilters) {
            if (f.type === 'level') filters.levels.push(f.data);
            else if (f.type === 'code') filters.codes.push(f.data);
            else filters.semesters.push();

            const sem = parseInt(f.split(' ')[3]);
            if (!filters['semesters'].includes(sem)) filters['semesters'].push(sem);
        }
        this.requests['courses'] = $.ajax({
            url: 'search/coursesearch',
            data: {
                'query': query,
                'filters': JSON.stringify(filters)
            },
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            beforeSend: before,
            success: function (data) {
                let new_data = {};
                let filtered_sessions = [];
                for (const filter of activeFilters) {
                    if (filter.type === 'session') filtered_sessions.push(filter.data);
                }
                for (const course of data.response) {
                    let offering = getCourseOffering(course.code, THIS_YEAR); // TODO: Fix for course years. Need the most recent year with data available.
                    let matched_filters = false;
                    for (session of filtered_sessions) {
                        matched_filters = matched_filters || offering.checkRequirements(plan, session).sat;
                    }
                    if (matched_filters) new_data.push(course)
                }
                after(new_data);
            },
            error: console.log('Course search aborted or failed. '),
            complete: console.log('Course search initiated. ')
        })
    };

    this.mmsSearch = function (query, before, after) {
        for (let type in this.requests) {
            if (type !== 'course' && this.requests[type] !== null) this.requests[type].abort();
        }
        before();
        this.requests['major'] = $.ajax({
            url: 'search/majors?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                after(data, 'major')
            },
            error: console.log('Major search aborted or failed. '),
            complete: console.log('Major search initiated. ')
        });
        curr_requests['minor'] = $.ajax({
            url: 'search/minors?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                after(data, 'minor')
            },
            error: console.log('Minor search aborted or failed. '),
            complete: console.log('Minor search initiated. ')
        });
        curr_requests['spec'] = $.ajax({
            url: 'search/specs?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                after(data, 'specialisation')
            },
            error: console.log('Specialisation search aborted or failed. '),
            complete: console.log('Specialisation search initiated. ')
        });
    };
    this.search = function (query, coursesOnly = false) {

        const resultsList = $('#search-results-list');
        resultsList.find('.result-course').popover('hide');

        curr_requests['course'] = $.ajax({
            url: 'search/coursesearch',
            data: {
                'query': query,
                'filters': JSON.stringify(filters)
            },
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            beforeSend: function () {
                const courseResultsList = resultsList.children().first();
                courseResultsList.find('.collapse').css({'display': 'none'});
                courseResultsList.find('.fa-refresh').css({'display': 'inline-block'});
            },
            success: updateCourseSearchResults,
            error: console.log('Course search aborted or failed. '),
            complete: console.log('Course search initiated. ')
        });
        if (coursesOnly) return;
        resultsList.find('.collapse').css({'display': 'none'});
        resultsList.find('.fa-refresh').css({'display': 'inline-block'});

        curr_requests['major'] = $.ajax({
            url: 'search/majors?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                updateMMSResults(data, 'major', $('#results-majors'))
            },
            error: console.log('Major search aborted or failed. '),
            complete: console.log('Major search initiated. ')
        });
        curr_requests['minor'] = $.ajax({
            url: 'search/minors?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                updateMMSResults(data, 'minor', $('#results-minors'))
            },
            error: console.log('Minor search aborted or failed. '),
            complete: console.log('Minor search initiated. ')
        });
        curr_requests['spec'] = $.ajax({
            url: 'search/specs?query=' + query,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                updateMMSResults(data, 'specialisation', $('#results-specs'))
            },
            error: console.log('Specialisation search aborted or failed. '),
            complete: console.log('Specialisation search initiated. ')
        });
    };

    this.addFilter = function (type, data) {
        if (this.getFilter(type, data) !== null) return false;
        const filter = new Filter(type, data);
        this.filters.push(filter);
        return filter;
    };

    this.deleteFilter = function (type, data) {
        let filter = this.getFilter(type, data);
        if (filter !== null) this.filters.splice(this.filters.indexOf(filter), 1);
        return filter || false;
    };

    this.getFilter = function (type, data) {
        for (const filter in this.filters) {
            if (filter.type === type && filter.data === data) return filter;
        }
        return null;
    }
}

function Filter(type, data) {
    this.type = type;   // "code", "level", or "session"
    this.data = data;   // e.g. "COMP", "2000", or "2016S1"

    this.toString = function () {
        if (type === 'session') {
            const year = this.data.split(0, 4);
            const ses = this.data.split(4);
            return "My " + year + " " + SESSION_WORDS[ses];
        } else return this.data;
    }
}
