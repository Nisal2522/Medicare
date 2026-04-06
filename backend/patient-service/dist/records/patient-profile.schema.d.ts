import { HydratedDocument, Types } from 'mongoose';
export type PatientProfileDocument = HydratedDocument<PatientProfile>;
export declare class PatientProfile {
    patientId: Types.ObjectId;
    avatarUrl: string;
}
export declare const PatientProfileSchema: import("mongoose").Schema<PatientProfile, import("mongoose").Model<PatientProfile, any, any, any, (import("mongoose").Document<unknown, any, PatientProfile, any, import("mongoose").DefaultSchemaOptions> & PatientProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, PatientProfile, any, import("mongoose").DefaultSchemaOptions> & PatientProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, PatientProfile>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PatientProfile, import("mongoose").Document<unknown, {}, PatientProfile, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PatientProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, PatientProfile, import("mongoose").Document<unknown, {}, PatientProfile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientProfile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    avatarUrl?: import("mongoose").SchemaDefinitionProperty<string, PatientProfile, import("mongoose").Document<unknown, {}, PatientProfile, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientProfile & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PatientProfile>;
