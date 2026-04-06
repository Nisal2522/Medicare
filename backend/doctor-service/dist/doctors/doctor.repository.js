"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const doctor_schema_1 = require("./doctor.schema");
const day_normalize_util_1 = require("./day-normalize.util");
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
let DoctorRepository = class DoctorRepository {
    doctorModel;
    constructor(doctorModel) {
        this.doctorModel = doctorModel;
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return null;
        }
        const row = await this.doctorModel.findById(id).lean().exec();
        return row;
    }
    async search(filters) {
        const parts = [];
        if (filters.name) {
            parts.push({ name: { $regex: escapeRegex(filters.name), $options: 'i' } });
        }
        if (filters.specialty) {
            parts.push({ specialty: { $regex: escapeRegex(filters.specialty), $options: 'i' } });
        }
        if (filters.location) {
            parts.push({ location: { $regex: escapeRegex(filters.location), $options: 'i' } });
        }
        if (filters.day) {
            const canonical = (0, day_normalize_util_1.normalizeDayFilter)(filters.day);
            if (canonical) {
                parts.push({
                    availability: {
                        $elemMatch: {
                            day: canonical,
                            isAvailable: true,
                        },
                    },
                });
            }
        }
        if (filters.availability === 'true') {
            parts.push({
                $and: [
                    { availability: { $exists: true, $not: { $size: 0 } } },
                    {
                        availability: {
                            $elemMatch: { isAvailable: true },
                        },
                    },
                ],
            });
        }
        else if (filters.availability === 'false') {
            parts.push({
                $or: [
                    { availability: { $exists: false } },
                    { availability: { $size: 0 } },
                    {
                        availability: {
                            $not: {
                                $elemMatch: { isAvailable: true },
                            },
                        },
                    },
                ],
            });
        }
        const query = parts.length === 0 ? {} : parts.length === 1 ? parts[0] : { $and: parts };
        const rows = await this.doctorModel
            .find(query)
            .select('_id name specialty experience qualification consultationFee profilePicture availability location hospital')
            .sort({ name: 1 })
            .lean()
            .exec();
        return rows;
    }
    async updateAvailability(id, availability) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return;
        }
        await this.doctorModel.updateOne({ _id: new mongoose_2.Types.ObjectId(id) }, { $set: { availability } });
    }
    async updateProfile(id, patch) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return false;
        }
        const res = await this.doctorModel
            .updateOne({ _id: new mongoose_2.Types.ObjectId(id) }, { $set: patch })
            .exec();
        return res.matchedCount > 0;
    }
    async setVerified(id, verified) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return false;
        }
        const res = await this.doctorModel
            .updateOne({ _id: new mongoose_2.Types.ObjectId(id) }, { $set: { isVerified: verified } })
            .exec();
        return res.matchedCount > 0;
    }
};
exports.DoctorRepository = DoctorRepository;
exports.DoctorRepository = DoctorRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(doctor_schema_1.Doctor.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DoctorRepository);
//# sourceMappingURL=doctor.repository.js.map