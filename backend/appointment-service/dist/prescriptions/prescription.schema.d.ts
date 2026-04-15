import { HydratedDocument, Types } from 'mongoose';
export type PrescriptionDocument = HydratedDocument<Prescription>;
export declare class Prescription {
    patientId?: Types.ObjectId;
    patientEmail: string;
    doctorId: Types.ObjectId;
    doctorName?: string;
    appointmentId: Types.ObjectId;
    diagnosis: string;
    symptoms?: string;
    clinicalNotes?: string;
    specialAdvice?: string;
    labTests?: string;
    followUpDate?: Date;
    patientName?: string;
    patientAge?: string;
    patientGender?: string;
    medicines: {
        name: string;
        dosage: string;
        frequency?: string;
        duration: string;
        instructions?: string;
    }[];
}
export declare const PrescriptionSchema: import("mongoose").Schema<Prescription, import("mongoose").Model<Prescription, any, any, any, any, any, Prescription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientEmail?: import("mongoose").SchemaDefinitionProperty<string, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appointmentId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    diagnosis?: import("mongoose").SchemaDefinitionProperty<string, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    symptoms?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    clinicalNotes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    specialAdvice?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    labTests?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    followUpDate?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientAge?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientGender?: import("mongoose").SchemaDefinitionProperty<string | undefined, Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    medicines?: import("mongoose").SchemaDefinitionProperty<{
        name: string;
        dosage: string;
        frequency?: string;
        duration: string;
        instructions?: string;
    }[], Prescription, import("mongoose").Document<unknown, {}, Prescription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Prescription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Prescription>;
