import { Schema, model, Types } from 'mongoose';

export enum BrandRequestStatus {
    NEW = 'NEW',
    REVIEWED = 'REVIEWED',
}

export interface IBrandRequest {
    _id: Types.ObjectId;
    brandName: string;        // name that seller requested
    requester?: Types.ObjectId; // optional link to User
    status: BrandRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

const brandRequestSchema = new Schema<IBrandRequest>(
    {
        brandName: {
            type: String,
            required: true,
            trim: true,
        },
        requester: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: Object.values(BrandRequestStatus),
            default: BrandRequestStatus.NEW,
        },
    },
    {
        timestamps: true,
    },
);

export const BrandRequest = model<IBrandRequest>('BrandRequest', brandRequestSchema);
