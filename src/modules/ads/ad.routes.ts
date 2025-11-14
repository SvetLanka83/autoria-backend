import { Router } from 'express';
import {
    createAd,
    getAds,
    getMyAds,
    getAdById,
    updateAd,
    getAdStats,
} from './ad.controller';
import { authGuard } from '../../middlewares/auth.middleware';

const adsRouter = Router();

// Public list of ACTIVE ads
adsRouter.get('/', getAds);

// Authenticated seller – list of own ads
adsRouter.get('/my', authGuard, getMyAds);

// Statistics for PREMIUM owner
adsRouter.get('/:id/stats', authGuard, getAdStats);

// Public details of single ad + increment views
adsRouter.get('/:id', getAdById);

// Create / update ad (only for authenticated sellers)
adsRouter.post('/', authGuard, createAd);
adsRouter.patch('/:id', authGuard, updateAd);

export default adsRouter;
