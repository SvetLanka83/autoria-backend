import { Schema, model, Document, Types } from 'mongoose';

// All possible user roles in the system
export enum UserRole {
    BUYER = 'BUYER',
    SELLER = 'SELLER',
    MANAGER = 'MANAGER',
    ADMIN = 'ADMIN',
}

// Account type for sellers
export enum AccountType {
    BASIC = 'BASIC',
    PREMIUM = 'PREMIUM',
}

// TypeScript interface that represents a User document in MongoDB
export interface IUser extends Document {
    _id: Types.ObjectId;        // MongoDB ObjectId
    email: string;
    password: string;
    name?: string;
    role: UserRole;
    accountType: AccountType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema definition for User
const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,    // email must be unique
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,  // plain password will never be stored, only hash
        },
        name: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.SELLER,  // default role is SELLER
        },
        accountType: {
            type: String,
            enum: Object.values(AccountType),
            default: AccountType.BASIC, // default account type is BASIC
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // automatically adds createdAt and updatedAt
    },
);

// Export Mongoose model
export const User = model<IUser>('User', userSchema);
