"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDayFilter = normalizeDayFilter;
const FULL_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
const SHORT_TO_FULL = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
};
function normalizeDayFilter(input) {
    const raw = input.trim().toLowerCase();
    if (!raw)
        return null;
    const short = raw.slice(0, 3);
    if (SHORT_TO_FULL[short] !== undefined) {
        return SHORT_TO_FULL[short];
    }
    for (const d of FULL_DAYS) {
        if (d.toLowerCase() === raw)
            return d;
    }
    return null;
}
//# sourceMappingURL=day-normalize.util.js.map