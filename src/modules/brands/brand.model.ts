import { Schema, model, Types } from 'mongoose';

// TypeScript interface for car brand document
export interface IBrand {
    _id: Types.ObjectId;
    name: string;       // e.g. "BMW"
    isActive: boolean;  // can be used to hide brand
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema for Brand
const brandSchema = new Schema<IBrand>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

export const Brand = model<IBrand>('Brand', brandSchema);
