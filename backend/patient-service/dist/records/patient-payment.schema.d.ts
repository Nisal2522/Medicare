import { HydratedDocument, Types } from 'mongoose';
export type PatientPaymentDocument = HydratedDocument<PatientPayment>;
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    REFUNDED = "refunded",
    FAILED = "failed"
}
export declare class PatientPayment {
    patientId: Types.ObjectId;
    amountCents: number;
    currency: string;
    description: string;
    status: PaymentStatus;
    reference: string;
    appointmentId: string | null;
}
export declare const PatientPaymentSchema: import("mongoose").Schema<PatientPayment, import("mongoose").Model<PatientPayment, any, any, any, (import("mongoose").Document<unknown, any, PatientPayment, any, import("mongoose").DefaultSchemaOptions> & PatientPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, PatientPayment, any, import("mongoose").DefaultSchemaOptions> & PatientPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, PatientPayment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amountCents?: import("mongoose").SchemaDefinitionProperty<number, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currency?: import("mongoose").SchemaDefinitionProperty<string, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<PaymentStatus, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reference?: import("mongoose").SchemaDefinitionProperty<string, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appointmentId?: import("mongoose").SchemaDefinitionProperty<string | null, PatientPayment, import("mongoose").Document<unknown, {}, PatientPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PatientPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PatientPayment>;
