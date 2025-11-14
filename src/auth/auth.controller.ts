import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole, AccountType } from '../modules/users/user.model';

// Shape of data that we will put into JWT
interface JwtPayload {
    userId: string;
    role: UserRole;
    accountType: AccountType;
}

// POST /auth/register
export const register = async (req: Request, res: Response) => {
    console.log('REGISTER START, body:', req.body);

    try {
        const { email, password, name } = req.body;

        // Basic validation
        if (!email || !password) {
            console.log('REGISTER VALIDATION FAILED (missing email or password)');
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Check if user already exists
        const existingUser: IUser | null = await User.findOne({ email });
        console.log('REGISTER existingUser:', existingUser);

        if (existingUser) {
            console.log('REGISTER: user already exists');
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('REGISTER hashedPassword created');

        // Create a new user document in MongoDB
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: UserRole.SELLER,           // new user is a SELLER by default
            accountType: AccountType.BASIC,  // default account type is BASIC
        });

        console.log('REGISTER user created with id:', user._id.toString());

        // Prepare safe user data (without password) for response
        const userData = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            accountType: user.accountType,
        };

        return res.status(201).json({
            message: 'User registered successfully.',
            user: userData,
        });
    } catch (error) {
        console.error('REGISTER ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
    console.log('LOGIN START, body:', req.body);

    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Try to find user by email
        const user: IUser | null = await User.findOne({ email });
        console.log('LOGIN user:', user);

        if (!user) {
            // If user not found, return generic error (no details)
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Compare plain text password with hashed password from DB
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Prepare payload for JWT
        const payload: JwtPayload = {
            userId: user._id.toString(),
            role: user.role,
            accountType: user.accountType,
        };

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error('JWT_SECRET is not set in .env');
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        // Sign a JWT token with 1 hour expiration
        const token = jwt.sign(payload, secret, {
            expiresIn: '1h',
        });

        return res.json({
            message: 'Login successful.',
            token,
        });
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
