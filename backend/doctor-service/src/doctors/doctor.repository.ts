import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor } from './doctor.schema';
import { normalizeDayFilter } from './day-normalize.util';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface DoctorSearchFilters {
  name?: string;
  specialty?: string;
  availability?: string;
  /** Canonical weekday e.g. Monday */
  day?: string;
  location?: string;
}

@Injectable()
export class DoctorRepository {
  constructor(@InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>) {}

  async findById(id: string): Promise<Doctor | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const row = await this.doctorModel.findById(id).lean().exec();
    return row as Doctor | null;
  }

  async search(filters: DoctorSearchFilters): Promise<Doctor[]> {
    const parts: Record<string, unknown>[] = [];

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
      const canonical = normalizeDayFilter(filters.day);
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
    } else if (filters.availability === 'false') {
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

    const query: Record<string, unknown> =
      parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { $and: parts };

    const rows = await this.doctorModel
      .find(query as never)
      .select(
        '_id name specialty experience qualification consultationFee profilePicture availability location hospital',
      )
      .sort({ name: 1 })
      .lean()
      .exec();

    return rows as Doctor[];
  }

  async updateAvailability(
    id: string,
    availability: {
      day: string;
      startTime: string;
      endTime: string;
      maxPatients: number;
      isAvailable: boolean;
    }[],
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      return;
    }
    await this.doctorModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { availability } },
    );
  }

  async updateProfile(
    id: string,
    patch: Partial<{
      specialty: string;
      qualification: string;
      experience: number;
      consultationFee: number;
      hospital: string;
      location: string;
      profilePicture: string;
    }>,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const res = await this.doctorModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: patch })
      .exec();
    return res.matchedCount > 0;
  }

  async setVerified(id: string, verified: boolean): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const res = await this.doctorModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: { isVerified: verified } })
      .exec();
    return res.matchedCount > 0;
  }
}
