/**
 * Class that represents a Major, Minor, or Specialisation.
 * @param code      ANU's code for the MMS, e.g. THCS-SPEC.
 * @param year      Year of the MMS, for the purpose of rules.
 * @param title     Name of the MMS, e.g. Theoretical Computer...
 * @param rules     Program Requirements (requirements to graduate).
 */
function MMS(code, year, title, rules) {
    this.code = code;
    this.year = year;
    this.title = title;
    this.rules = rules;

    this.type = code.split('-')[1]; // Type of MMS, e.g. MAJ, MIN, etc.
    this.units = TYPE_UNITS[this.type]; // Total number of required units, e.g. 48 for Majors.

    /**
     * Check if this MMS's requirements are satisfied in the given plan.
     * @param plan  The user's plan to check.
     * @returns {{sat: boolean, units: int, rule_details: Array}}
     *      sat:    boolean; Whether or not the MMS requirements were met overall.
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

        for (let section in this.rules) {
            if (!(this.rules.hasOwnProperty(section))) continue;
            const rule = this.rules[section];
            const matches = matchInDegree(plan, new Set(rule.course.map(c => c.code)));
            let section_units = matches.map(c => c.course.units).reduce((x, y) => x + y);
            let section_codes = matches.map(c => c.code);
            let section_sat = true;
            if (rule.type === 'fixed') section_sat = matches.size === rule.course.length;
            if (rule.type === 'minimum') section_sat = section_units >= rule.units;
            overall_sat = overall_sat && section_sat;
            overall_units += (rule.type === 'maximum') ? min(section_units, rule.units) : section_units;
            rule_details.push({'sat': section_sat, 'units': section_units, 'codes': section_codes});
        }
        return {'sat': overall_sat, 'units': overall_units, 'rule_details': rule_details};
    }
}

/**
 * Find courses in a plan which have particular codes. Ignore courses which are marked as failed.
 * @param {Plan} plan       The user's plan to check against.
 * @param {string[]} codes  The course codes to look for.
 * @returns {CourseEnrolment[]} A list of CourseEnrolments from the degree which are in the code list.
 */
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

/**
 * Dictionary to convert from MMS type code (MAJ/MIN) to required units.
 * @type {{MAJ: number, MIN: number, SPEC: number, HSPC: number}}
 */
const TYPE_UNITS = {
    "MAJ": 48,
    "MIN": 24,
    "SPEC": 24,
    "HSPC": 48
};

/**
 * Dictionary to convert from MMS type code (MAJ/MIN) to full text.
 * @type {{MAJ: string, MIN: string, SPEC: string, HSPC: string}}
 */
const TYPE_PRINT = {
    "MAJ": "Major",
    "MIN": "Minor",
    "SPEC": "Specialisation",
    "HSPC": "Honours Specialisation"
};
