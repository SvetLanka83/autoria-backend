import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { User, AccountType } from './user.model';

// PATCH /users/upgrade
export const upgradeToPremium = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.accountType === AccountType.PREMIUM) {
            return res
                .status(400)
                .json({ message: 'User already has PREMIUM account.' });
        }

        user.accountType = AccountType.PREMIUM;
        await user.save();

        return res.json({
            message: 'Account upgraded to PREMIUM successfully.',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                accountType: user.accountType,
            },
        });
    } catch (err) {
        console.error('upgradeToPremium error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
