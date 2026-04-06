import { HydratedDocument, Types } from 'mongoose';
export type AppointmentDocument = HydratedDocument<Appointment>;
export declare enum AppointmentStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
    PENDING = "PENDING"
}
export declare enum DoctorApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class Appointment {
    doctorId: Types.ObjectId;
    doctorName: string;
    doctorSpecialty?: string;
    patientId?: Types.ObjectId;
    patientEmail: string;
    patientName: string;
    patientPhone?: string;
    doctorPhone?: string;
    doctorEmail?: string;
    appointmentDateKey: string;
    day: string;
    startTime: string;
    endTime: string;
    consultationFee: number;
    status: AppointmentStatus;
    doctorApprovalStatus: DoctorApprovalStatus;
    paymentStatus: string;
    slotKey: string;
    slotSeat?: number;
}
export declare const AppointmentSchema: import("mongoose").Schema<Appointment, import("mongoose").Model<Appointment, any, any, any, any, any, Appointment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    doctorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorName?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorSpecialty?: import("mongoose").SchemaDefinitionProperty<string | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientEmail?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientName?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    patientPhone?: import("mongoose").SchemaDefinitionProperty<string | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorPhone?: import("mongoose").SchemaDefinitionProperty<string | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorEmail?: import("mongoose").SchemaDefinitionProperty<string | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appointmentDateKey?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    day?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startTime?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endTime?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    consultationFee?: import("mongoose").SchemaDefinitionProperty<number, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<AppointmentStatus, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    doctorApprovalStatus?: import("mongoose").SchemaDefinitionProperty<DoctorApprovalStatus, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slotKey?: import("mongoose").SchemaDefinitionProperty<string, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slotSeat?: import("mongoose").SchemaDefinitionProperty<number | undefined, Appointment, import("mongoose").Document<unknown, {}, Appointment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Appointment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Appointment>;
