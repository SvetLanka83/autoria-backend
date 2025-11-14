import { Schema, model, Types } from 'mongoose';
import { CurrencyCode } from '../../services/currency.service';

// Possible statuses for an advertisement
export enum AdStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    REVIEW_REQUIRED = 'REVIEW_REQUIRED', // when bad words detected
}

// TypeScript interface that represents an Ad document in MongoDB
// We DO NOT extend mongoose.Document here to avoid type conflicts
export interface IAd {
    _id: Types.ObjectId;        // MongoDB ObjectId
    owner: Types.ObjectId;      // reference to User
    make: string;               // car brand (e.g. BMW)
    model: string;              // car model (e.g. X5)
    description: string;
    region: string;             // city or region where car is sold

    originalPrice: number;
    originalCurrency: CurrencyCode;

    priceUSD: number;
    priceEUR: number;
    priceUAH: number;

    rateSource: string;
    rateDate: Date;

    status: AdStatus;
    profanityCheckAttempts: number;

    // view statistics
    viewsTotal: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    viewsUpdatedAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

// Mongoose schema for Ad
const adSchema = new Schema<IAd>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        make: {
            type: String,
            required: true,
            trim: true,
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        region: {
            type: String,
            required: true,
            trim: true,
        },
        originalPrice: {
            type: Number,
            required: true,
        },
        originalCurrency: {
            type: String,
            enum: ['USD', 'EUR', 'UAH'],
            required: true,
        },
        priceUSD: {
            type: Number,
            required: true,
        },
        priceEUR: {
            type: Number,
            required: true,
        },
        priceUAH: {
            type: Number,
            required: true,
        },
        rateSource: {
            type: String,
            required: true,
        },
        rateDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(AdStatus),
            default: AdStatus.ACTIVE,
        },
        profanityCheckAttempts: {
            type: Number,
            default: 0,
        },

        // View statistics
        viewsTotal: {
            type: Number,
            default: 0,
        },
        viewsToday: {
            type: Number,
            default: 0,
        },
        viewsThisWeek: {
            type: Number,
            default: 0,
        },
        viewsThisMonth: {
            type: Number,
            default: 0,
        },
        viewsUpdatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

// We don't pass generic here to avoid extra TS constraints – runtime is what matters
export const Ad = model('Ad', adSchema);
