"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], default: 'PATIENT' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'users' });
const UserModel = mongoose_1.default.model('User', userSchema);
async function run() {
    const mongoUri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/healthcare-platform';
    const email = (process.env.ADMIN_EMAIL ?? 'admin@medismart.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';
    const fullName = (process.env.ADMIN_FULL_NAME ?? 'System Administrator').trim();
    await mongoose_1.default.connect(mongoUri);
    try {
        const existing = await UserModel.findOne({ email }).lean().exec();
        if (existing) {
            console.log(`Admin already exists: ${email}`);
            return;
        }
        const hash = await bcrypt.hash(password, 10);
        await UserModel.create({
            fullName,
            email,
            password: hash,
            role: 'ADMIN',
            isActive: true,
            phone: '',
        });
        console.log(`Admin user created: ${email}`);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
void run().catch((err) => {
    console.error('Failed to seed admin user');
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map