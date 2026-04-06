"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOMBO_TZ = void 0;
exports.withColomboZone = withColomboZone;
exports.isSlotOrderValid = isSlotOrderValid;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.COLOMBO_TZ = 'Asia/Colombo';
function withColomboZone(slot) {
    return {
        ...slot,
        timeZone: exports.COLOMBO_TZ,
    };
}
function isSlotOrderValid(startTime, endTime) {
    const dayRef = moment_timezone_1.default.tz('2000-06-15', exports.COLOMBO_TZ);
    const base = dayRef.format('YYYY-MM-DD');
    const a = moment_timezone_1.default.tz(`${base} ${startTime}`, ['h:mm A', 'HH:mm'], true, exports.COLOMBO_TZ);
    const b = moment_timezone_1.default.tz(`${base} ${endTime}`, ['h:mm A', 'HH:mm'], true, exports.COLOMBO_TZ);
    return a.isValid() && b.isValid() && a.isBefore(b);
}
//# sourceMappingURL=timezone.util.js.map