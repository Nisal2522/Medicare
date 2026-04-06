import { HydratedDocument, Types } from 'mongoose';
export type AppointmentRefDocument = HydratedDocument<AppointmentRef>;
export declare class AppointmentRef {
    doctorId: Types.ObjectId;
    patientId?: Types.ObjectId;
    patientEmail: string;
    status: string;
    doctorApprovalStatus: string;
}
export declare const AppointmentRefSchema: import("mongoose").Schema<AppointmentRef, import("mongoose").Model<AppointmentRef, any, any, any, (import("mongoose").Document<unknown, any, AppointmentRef, any, import("mongoose").DefaultSchemaOptions> & AppointmentRef & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, AppointmentRef, any, import("mongoose").DefaultSchemaOptions> & AppointmentRef & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, AppointmentRef>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    doctorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientEmail?: import("mongoose").SchemaDefinitionProperty<string, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorApprovalStatus?: import("mongoose").SchemaDefinitionProperty<string, AppointmentRef, import("mongoose").Document<unknown, {}, AppointmentRef, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppointmentRef & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AppointmentRef>;
