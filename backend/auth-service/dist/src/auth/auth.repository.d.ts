import { Model } from 'mongoose';
import { Role } from './enums/role.enum';
import { User, UserDocument } from './schemas/user.schema';
export declare class AuthRepository {
    private readonly userModel;
    constructor(userModel: Model<User>);
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    create(data: Partial<User>): Promise<UserDocument>;
    deleteById(id: string): Promise<void>;
    countActiveByRole(role: Role): Promise<number>;
}
