import { HydratedDocument } from 'mongoose';
export type DoctorDocument = HydratedDocument<Doctor>;
export declare class AvailabilitySlot {
    day: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
    isAvailable: boolean;
}
export declare const AvailabilitySlotSchema: import("mongoose").Schema<AvailabilitySlot, import("mongoose").Model<AvailabilitySlot, any, any, any, (import("mongoose").Document<unknown, any, AvailabilitySlot, any, import("mongoose").DefaultSchemaOptions> & AvailabilitySlot & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, AvailabilitySlot, any, import("mongoose").DefaultSchemaOptions> & AvailabilitySlot & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, AvailabilitySlot>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    day?: import("mongoose").SchemaDefinitionProperty<string, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startTime?: import("mongoose").SchemaDefinitionProperty<string, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endTime?: import("mongoose").SchemaDefinitionProperty<string, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxPatients?: import("mongoose").SchemaDefinitionProperty<number, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isAvailable?: import("mongoose").SchemaDefinitionProperty<boolean, AvailabilitySlot, import("mongoose").Document<unknown, {}, AvailabilitySlot, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AvailabilitySlot & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AvailabilitySlot>;
export declare class Doctor {
    name: string;
    specialty: string;
    experience: number;
    qualification: string;
    consultationFee: number;
    profilePicture: string;
    availability: AvailabilitySlot[];
    location: string;
    hospital: string;
    isVerified: boolean;
}
export declare const DoctorSchema: import("mongoose").Schema<Doctor, import("mongoose").Model<Doctor, any, any, any, (import("mongoose").Document<unknown, any, Doctor, any, import("mongoose").DefaultSchemaOptions> & Doctor & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, Doctor, any, import("mongoose").DefaultSchemaOptions> & Doctor & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Doctor>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    specialty?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    experience?: import("mongoose").SchemaDefinitionProperty<number, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    qualification?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    consultationFee?: import("mongoose").SchemaDefinitionProperty<number, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    profilePicture?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    availability?: import("mongoose").SchemaDefinitionProperty<AvailabilitySlot[], Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hospital?: import("mongoose").SchemaDefinitionProperty<string, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isVerified?: import("mongoose").SchemaDefinitionProperty<boolean, Doctor, import("mongoose").Document<unknown, {}, Doctor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Doctor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Doctor>;
