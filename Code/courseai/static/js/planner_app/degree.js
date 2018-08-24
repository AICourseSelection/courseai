/**
 * Class that represents a coursework degree.
 * @param code      ANU's degree code, e.g. AACOM.
 * @param year      Year of degree, for the purpose of rules.
 * @param title     Title of degree, e.g. Bachelor of...
 * @param rules     Program Requirements (requirements to graduate).
 * @param suggestedPlan Suggested starting plan by the ANU, i.e. the "Study Options".
 */
function Degree(code, year, title, rules, suggestedPlan = {}) {
    this.code = code;
    this.year = year;
    this.title = title;
    this.rules = rules;
    this.suggestedPlan = suggestedPlan;

    this.totalUnits = rules.units;

    /**
     * Check if this Degree's requirements are satisfied in the given plan.
     * @param plan  The user's plan to check.
     * @returns {{sat: boolean, units: int, rule_details: Array}}
     *      sat:    boolean; Whether or not the degree requirements were met overall.
     *      units:  int;     The number of units from all courses contributing to this MMS.
     *      rule_details: {sat: boolean, units: int, codes: [string]}[]
     *          Details on satisfying of individual components.
     *          List items are in the same order as the rules themselves.
     *          sat:    Whether or not this particular component was satisfied.
     *          units:  The number of units from courses contributing to this component.
     *          codes:  List of course codes which contributed to this component.
     */
    this.checkRequirements = function (plan) {
        let overall_sat = true;
        let overall_units = 0;
        let rule_details = [];

        let req = this.rules;
        for (let type in req) {
            if (!(req.hasOwnProperty(type))) continue;

            if (["compulsory_courses", "one_from_here", "x_from_here"].includes(type)) {
                for (const section of (type === "compulsory_courses") ? [req[type]] : req[type]) {
                    const courses = (type === "x_from_here") ? section.courses : section;
                    const matches = matchInDegree(plan, new Set(courses));
                    let section_units = matches.map(c => c.course.units).reduce((x, y) => x + y, 0);
                    let section_codes = matches.map(c => c.code);
                    let section_sat = true;
                    if (type === "compulsory_courses") section_sat = matches.size === section.length;
                    if (type === "one_from_here") section_sat = matches.size >= 1;
                    if (type === "x_from_here") section_sat = section_units >= section.num;
                    overall_sat = overall_sat && section_sat;
                    rule_details.push({'type': type, 'sat': section_sat, 'units': section_units, 'codes': section_codes});
                }
            }
            else if (["x_from_category", "max_by_level"].includes(type)) {
                const maxL = type === "max_by_level";
                for (const i in req[type]) {
                    let courseCodes = [];
                    let courseLevels = [];
                    let unitThreshold = 0;
                    if (maxL) {
                        courseLevels = [i];
                        unitThreshold = req[type][i];
                    } else {
                        courseCodes = section["code"] || [];
                        courseLevels = section["level"] || [];
                        unitThreshold = section["num"];
                    }
                    const matches = matchCategoryInDegree(plan, courseCodes, courseLevels);
                    let section_units = matches.map(c => c.course.units).reduce((x, y) => x + y, 0);
                    let section_codes = matches.map(c => c.code);
                    let section_sat = true;
                    section_sat = (2 * maxL - 1) * (section_units - unitThreshold) <= 0;
                    overall_sat = overall_sat && section_sat;
                    rule_details.push({'type': type, 'sat': section_sat, 'units': section_units, 'codes': section_codes});
                }
            }
            else if (["required_m/m/s", "one_from_m/m/s"].includes(type)) {
                let lists = req[type];
                if (type === "required_m/m/s") lists = [req[type]];
                for (const section of lists) {
                    let matched_codes = [];
                    let completed_codes = [];
                    for (const mms of plan.trackedMMS) {
                        if (section.includes(mms.code)) matched_codes.push(mms.code);
                        if (mms.checkRequirements(plan).sat) completed_codes.push(mms.code);
                    }
                    let section_sat = completed_codes.length > 0;
                    overall_sat = overall_sat && section_sat;
                    rule_details.push({'type': type, 'sat': section_sat, 'codes': matched_codes, 'completed': completed_codes});
                }
            }
        }
        for (const session of plan.sessions) {
            for (const enrolment of plan.courses[session]) {
                if (!(enrolment.failed)) overall_units += enrolment.course.units;
            }
        }
        overall_sat = overall_sat && overall_units >= this.totalUnits;
        return {'sat': overall_sat, 'units': overall_units, 'rule_details': rule_details};
    };
}

function matchInDegree(plan, codes) {
    let matches = [];
    for (let session of plan.sessions) {
        const courses = plan.courses[session];
        for (let c of courses) {
            if (!c.failed && codes.delete(c.code)) matches.push(c);
        }
    }
    return matches;
}

function matchCategoryInDegree(plan, codes, levels) {
    let matches = [];
    for (let session of plan.sessions) {
        const courses = plan.courses[session];
        for (let c of courses) {
            let match = true;
            if (codes && codes.length > 0) {
                match = match && codes.includes(c.code.slice(0, 4));
            }
            if (levels && levels) {
                match = match && levels.includes(parseInt(c.code.charAt(4)) * 1000);
            }
            if (match && !c.failed) matches.push(c.code)
        }
    }
    return matches;
}