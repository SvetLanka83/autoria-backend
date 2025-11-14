import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, AccountType } from '../modules/users/user.model';

// Shape of data stored inside JWT token
export interface AuthPayload {
    userId: string;
    role: UserRole;
    accountType: AccountType;
}

// Extended Request type that will contain "user" property
export interface AuthRequest extends Request {
    user?: AuthPayload;
}

// Middleware to protect routes that require authentication
export const authGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Read Authorization header, expected format: "Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header is missing.' });
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Invalid Authorization header format.' });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error('JWT_SECRET is not set in .env');
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        // Verify token and decode payload
        const decoded = jwt.verify(token, secret) as AuthPayload;

        // Attach user payload to request object so that controllers can use it
        req.user = decoded;

        // Continue to the next middleware / controller
        return next();
    } catch (error) {
        console.error('authGuard error:', error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
