import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Ad, AdStatus, IAd } from './ad.model';
import { calculatePrices, CurrencyCode } from '../../services/currency.service';
import { AccountType, UserRole } from '../users/user.model';

// Simple mock profanity checker
const containsBadWords = (text: string): boolean => {
    const lower = text.toLowerCase();
    const bannedWords = ['badword', 'curse', 'xxx']; // demo list
    return bannedWords.some((word) => lower.includes(word));
};

// Just a mock "notification" to managers (logs to console)
const notifyManagerAboutAd = (ad: IAd, reason: string) => {
    console.log('[MANAGER NOTIFICATION]', {
        adId: ad._id.toString(),
        reason,
        status: ad.status,
    });
};

// Helper to update view counters (total / today / week / month)
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS; // simple approximation

const updateAdViews = (ad: IAd) => {
    const now = new Date();
    const last = ad.viewsUpdatedAt ? new Date(ad.viewsUpdatedAt) : new Date(ad.createdAt);

    const diffMs = now.getTime() - last.getTime();

    // Reset counters if last view was too long ago
    if (diffMs > DAY_MS) {
        ad.viewsToday = 0;
    }
    if (diffMs > WEEK_MS) {
        ad.viewsThisWeek = 0;
    }
    if (diffMs > MONTH_MS) {
        ad.viewsThisMonth = 0;
    }

    // Increment counters
    ad.viewsTotal += 1;
    ad.viewsToday += 1;
    ad.viewsThisWeek += 1;
    ad.viewsThisMonth += 1;
    ad.viewsUpdatedAt = now;
};

// POST /ads  – create new ad
export const createAd = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        if (req.user.role !== UserRole.SELLER) {
            return res.status(403).json({ message: 'Only sellers can create ads.' });
        }

        const { make, model, description, region, price, currency } = req.body;

        if (!make || !model || !description || !region || !price || !currency) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ message: 'Price must be a positive number.' });
        }

        const currencyCode = currency as CurrencyCode;
        if (!['USD', 'EUR', 'UAH'].includes(currencyCode)) {
            return res.status(400).json({ message: 'Currency must be one of USD, EUR or UAH.' });
        }

        // BASIC account: only 1 active ad
        if (req.user.accountType === AccountType.BASIC) {
            const activeAdsCount = await Ad.countDocuments({
                owner: req.user.userId,
                status: AdStatus.ACTIVE,
            });

            if (activeAdsCount >= 1) {
                return res.status(403).json({
                    message: 'BASIC account can only have 1 active advertisement. Upgrade to PREMIUM.',
                });
            }
        }

        const priceResult = calculatePrices(numericPrice, currencyCode);

        let status: AdStatus = AdStatus.ACTIVE;
        let attempts = 0;

        if (containsBadWords(description)) {
            status = AdStatus.REVIEW_REQUIRED;
            attempts = 1;
        }

        const ad: IAd = await Ad.create({
            owner: req.user.userId,
            make,
            model,
            description,
            region,
            originalPrice: numericPrice,
            originalCurrency: currencyCode,
            priceUSD: priceResult.priceUSD,
            priceEUR: priceResult.priceEUR,
            priceUAH: priceResult.priceUAH,
            rateSource: priceResult.rateSource,
            rateDate: priceResult.rateDate,
            status,
            profanityCheckAttempts: attempts,
            // view counters will be set to defaults
        });

        if (status === AdStatus.REVIEW_REQUIRED) {
            notifyManagerAboutAd(ad, 'Bad words detected on creation');
        }

        return res.status(201).json({
            message:
                status === AdStatus.ACTIVE
                    ? 'Ad created successfully.'
                    : 'Ad requires changes due to inappropriate language.',
            ad,
        });
    } catch (error) {
        console.error('CREATE AD ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /ads – public list of ACTIVE ads
export const getAds = async (req: Request, res: Response) => {
    try {
        const ads: IAd[] = await Ad.find({ status: AdStatus.ACTIVE }).lean();

        return res.json({
            message: 'List of active ads.',
            ads,
        });
    } catch (error) {
        console.error('GET ADS ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /ads/my – list of ads of current seller
export const getMyAds = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        const ads: IAd[] = await Ad.find({ owner: req.user.userId }).lean();

        return res.json({
            message: 'List of your ads.',
            ads,
        });
    } catch (error) {
        console.error('GET MY ADS ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /ads/:id  – public details for single ACTIVE ad + increment views
export const getAdById = async (req: Request, res: Response) => {
    try {
        const adId = req.params.id;

        if (!Types.ObjectId.isValid(adId)) {
            return res.status(400).json({ message: 'Invalid ad id.' });
        }

        const ad = await Ad.findById(adId);

        if (!ad || ad.status !== AdStatus.ACTIVE) {
            return res.status(404).json({ message: 'Ad not found.' });
        }

        updateAdViews(ad);
        await ad.save();

        return res.json({
            message: 'Ad details.',
            ad,
        });
    } catch (error) {
        console.error('GET AD BY ID ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// PATCH /ads/:id – edit ad with max 3 profanity attempts
export const updateAd = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        const adId = req.params.id;

        if (!Types.ObjectId.isValid(adId)) {
            return res.status(400).json({ message: 'Invalid ad id.' });
        }

        const ad = await Ad.findById(adId);

        if (!ad) {
            return res.status(404).json({ message: 'Ad not found.' });
        }

        // Only owner can edit the ad
        if (ad.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can edit only your own ads.' });
        }

        // If ad already inactive, we do not allow further edits (business decision)
        if (ad.status === AdStatus.INACTIVE) {
            return res.status(400).json({
                message: 'Ad is inactive and cannot be edited anymore.',
            });
        }

        const { make, model, description, region, price, currency } = req.body;

        // Update simple fields if provided
        if (make) ad.make = make;
        if (model) ad.model = model;
        if (region) ad.region = region;

        // Handle price & currency update
        let needRecalculatePrice = false;

        if (typeof price !== 'undefined') {
            const numericPrice = Number(price);
            if (Number.isNaN(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({ message: 'Price must be a positive number.' });
            }
            ad.originalPrice = numericPrice;
            needRecalculatePrice = true;
        }

        if (typeof currency !== 'undefined') {
            const currencyCode = currency as CurrencyCode;
            if (!['USD', 'EUR', 'UAH'].includes(currencyCode)) {
                return res.status(400).json({ message: 'Currency must be one of USD, EUR or UAH.' });
            }
            ad.originalCurrency = currencyCode;
            needRecalculatePrice = true;
        }

        if (needRecalculatePrice) {
            const priceResult = calculatePrices(
                ad.originalPrice,
                ad.originalCurrency as CurrencyCode,
            );
            ad.priceUSD = priceResult.priceUSD;
            ad.priceEUR = priceResult.priceEUR;
            ad.priceUAH = priceResult.priceUAH;
            ad.rateSource = priceResult.rateSource;
            ad.rateDate = priceResult.rateDate;
        }

        // Handle description + profanity logic
        if (typeof description !== 'undefined') {
            ad.description = description;

            if (containsBadWords(description)) {
                // One more failed attempt
                ad.profanityCheckAttempts += 1;

                if (ad.profanityCheckAttempts >= 3) {
                    // Too many failed attempts -> INACTIVE and notify manager
                    ad.status = AdStatus.INACTIVE;
                    await ad.save();

                    notifyManagerAboutAd(ad, 'Ad deactivated after 3 failed profanity checks');

                    return res.status(400).json({
                        message:
                            'Ad contains forbidden words. You have reached the maximum number of attempts. Ad is now INACTIVE and will be reviewed by a manager.',
                        ad,
                    });
                } else {
                    // Still can try again
                    ad.status = AdStatus.REVIEW_REQUIRED;
                    await ad.save();

                    notifyManagerAboutAd(ad, 'Bad words detected on update');

                    return res.status(400).json({
                        message: `Ad contains forbidden words. You can edit it ${
                            3 - ad.profanityCheckAttempts
                        } more time(s).`,
                        ad,
                    });
                }
            } else {
                // Description is clean -> activate ad
                ad.status = AdStatus.ACTIVE;
            }
        }

        // Save final state
        await ad.save();

        return res.json({
            message: 'Ad updated successfully.',
            ad,
        });
    } catch (error) {
        console.error('UPDATE AD ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /ads/:id/stats – statistics for PREMIUM owner
export const getAdStats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        const adId = req.params.id;

        if (!Types.ObjectId.isValid(adId)) {
            return res.status(400).json({ message: 'Invalid ad id.' });
        }

        const ad = await Ad.findById(adId);

        if (!ad) {
            return res.status(404).json({ message: 'Ad not found.' });
        }

        // Only owner can see stats
        if (ad.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can see statistics only for your own ads.' });
        }

        if (req.user.accountType !== AccountType.PREMIUM) {
            return res
                .status(403)
                .json({ message: 'Only PREMIUM sellers can see detailed statistics.' });
        }

        // Prepare base filter for aggregations
        const baseMatch = {
            make: ad.make,
            model: ad.model,
            status: AdStatus.ACTIVE,
        };

        // Average price for this car (same make+model) in the same region
        const [regionStats] = await Ad.aggregate([
            { $match: { ...baseMatch, region: ad.region } },
            { $group: { _id: null, avgPriceUAH: { $avg: '$priceUAH' } } },
        ]);

        // Average price for this car across the whole country (Ukraine)
        const [countryStats] = await Ad.aggregate([
            { $match: baseMatch },
            { $group: { _id: null, avgPriceUAH: { $avg: '$priceUAH' } } },
        ]);

        const regionAvg = regionStats ? Math.round(regionStats.avgPriceUAH * 100) / 100 : null;
        const countryAvg = countryStats ? Math.round(countryStats.avgPriceUAH * 100) / 100 : null;

        return res.json({
            message: 'Statistics for this ad (PREMIUM only).',
            stats: {
                views: {
                    total: ad.viewsTotal,
                    today: ad.viewsToday,
                    thisWeek: ad.viewsThisWeek,
                    thisMonth: ad.viewsThisMonth,
                },
                averagePrice: {
                    region: {
                        region: ad.region,
                        currency: 'UAH',
                        value: regionAvg,
                    },
                    country: {
                        currency: 'UAH',
                        value: countryAvg,
                    },
                },
            },
        });
    } catch (error) {
        console.error('GET AD STATS ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
