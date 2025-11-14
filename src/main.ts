// src/main.ts
import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './configs/config';
import authRouter from './auth/auth.routes';
import { authGuard, AuthRequest } from './middlewares/auth.middleware';
import adsRouter from './modules/ads/ad.routes';
import userRouter from './modules/users/user.routes';
import brandRouter from './modules/brands/brand.routes';

const app: Application = express();

// Global middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Test protected route: returns current user from token
app.get('/me', authGuard, (req: AuthRequest, res: Response) => {
    return res.json({
        message: 'Current authenticated user payload.',
        user: req.user,
    });
});

// Auth routes
app.use('/auth', authRouter);

// User routes (account management, upgrade to PREMIUM)
app.use('/users', userRouter);

// Ads routes (all ads endpoints start with /ads)
app.use('/ads', adsRouter);

// Brands routes – /brands, /brands/request
app.use('/brands', brandRouter);

const PORT = process.env.PORT || 3000;

const start = async (): Promise<void> => {
    try {
        console.log('MONGO_URI from env:', process.env.MONGO_URI);
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('App start error:', (err as Error).message);
        process.exit(1);
    }
};

start();
