// src/modules/brands/brand.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../../middlewares/auth.middleware';

const router = Router();

// Статический список брендов для выпадайки
const BRANDS = [
    'Audi',
    'BMW',
    'Mercedes-Benz',
    'Volkswagen',
    'Toyota',
    'Honda',
    'Nissan',
    'Skoda',
    'Ford',
    'Kia',
];

// GET /brands  – список марок
router.get('/', (req: Request, res: Response) => {
    return res.json({
        message: 'List of available car brands.',
        brands: BRANDS,
    });
});

// POST /brands/request – продавец сообщает, что марки нет в списке
router.post('/request', authGuard, (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Brand name is required.' });
    }

    // Сейчас просто логируем – для контрольной этого достаточно
    console.log('[BRAND REQUEST]', {
        requestedBrand: name,
        userId: req.user?.userId,
    });

    return res.status(201).json({
        message:
            'Brand request has been created and will be reviewed by administrator.',
    });
});

export default router;
