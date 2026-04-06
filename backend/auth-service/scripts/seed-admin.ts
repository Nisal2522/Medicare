import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

type UserDoc = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  isActive?: boolean;
};

const userSchema = new mongoose.Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], default: 'PATIENT' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'users' },
);

const UserModel = mongoose.model<UserDoc>('User', userSchema);

async function run() {
  const mongoUri =
    process.env.MONGO_URI ?? 'mongodb://localhost:27017/healthcare-platform';
  const email = (process.env.ADMIN_EMAIL ?? 'admin@medismart.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const fullName = (process.env.ADMIN_FULL_NAME ?? 'System Administrator').trim();

  await mongoose.connect(mongoUri);
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
  } finally {
    await mongoose.disconnect();
  }
}

void run().catch((err) => {
  console.error('Failed to seed admin user');
  console.error(err);
  process.exit(1);
});
