import { HydratedDocument } from 'mongoose';
export type LandingPartnerDocument = HydratedDocument<LandingPartner>;
export declare class LandingPartner {
    name: string;
    sortOrder: number;
}
export declare const LandingPartnerSchema: import("mongoose").Schema<LandingPartner, import("mongoose").Model<LandingPartner, any, any, any, (import("mongoose").Document<unknown, any, LandingPartner, any, import("mongoose").DefaultSchemaOptions> & LandingPartner & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (import("mongoose").Document<unknown, any, LandingPartner, any, import("mongoose").DefaultSchemaOptions> & LandingPartner & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, LandingPartner>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LandingPartner, import("mongoose").Document<unknown, {}, LandingPartner, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<LandingPartner & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, LandingPartner, import("mongoose").Document<unknown, {}, LandingPartner, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LandingPartner & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, LandingPartner, import("mongoose").Document<unknown, {}, LandingPartner, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LandingPartner & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, LandingPartner>;
