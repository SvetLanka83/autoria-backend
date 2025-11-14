// src/modules/users/user.routes.ts
import { Router } from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import { upgradeToPremium } from './user.controller';

const router = Router();

// PATCH /users/upgrade - upgrade current user to PREMIUM
router.patch('/upgrade', authGuard, upgradeToPremium);

export default router;
