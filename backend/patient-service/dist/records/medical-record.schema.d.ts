import { HydratedDocument, Types } from 'mongoose';
export declare enum MedicalRecordType {
    PRESCRIPTION = "prescription",
    REPORT = "report"
}
export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;
export declare class MedicalRecord {
    patientId: Types.ObjectId;
    type: MedicalRecordType;
    title: string;
    doctorName: string;
    specialty: string;
    reportCategory: string;
    fileName: string;
    fileUrl: string;
}
export declare const MedicalRecordSchema: import("mongoose").Schema<MedicalRecord, import("mongoose").Model<MedicalRecord, any, any, any, (import("mongoose").Document<unknown, any, MedicalRecord, any, import("mongoose").DefaultSchemaOptions> & MedicalRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, MedicalRecord, any, import("mongoose").DefaultSchemaOptions> & MedicalRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, MedicalRecord>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<MedicalRecordType, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorName?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    specialty?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reportCategory?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fileName?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fileUrl?: import("mongoose").SchemaDefinitionProperty<string, MedicalRecord, import("mongoose").Document<unknown, {}, MedicalRecord, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<MedicalRecord & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, MedicalRecord>;
