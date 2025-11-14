import { Request, Response } from 'express';
import { Brand } from './brand.model';
import { BrandRequest } from './brand-request.model';
import { AuthRequest } from '../../middlewares/auth.middleware';

// GET /brands
// Returns list of active brands for dropdown
export const getAllBrands = async (req: Request, res: Response) => {
    try {
        const brands = await Brand.find({ isActive: true }).sort({ name: 1 });

        return res.json({
            message: 'List of available car brands.',
            brands,
        });
    } catch (error) {
        console.error('getAllBrands error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /brands/request
// Seller reports that some brand is missing
export const requestNewBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Brand name is required.' });
        }

        const request = await BrandRequest.create({
            brandName: name,
            requester: req.user?.userId, // we save who asked (if token exists)
        });

        return res.status(201).json({
            message: 'Brand request has been created and will be reviewed by admin.',
            requestId: request._id,
        });
    } catch (error) {
        console.error('requestNewBrand error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
