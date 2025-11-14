import { Router } from 'express';
import { register, login } from './auth.controller';

// Create new router instance
const authRouter = Router();

// Route for user registration
// We pass handler *function itself*, not register()
authRouter.post('/register', register);

// Route for user login
authRouter.post('/login', login);

// Export router as default
export default authRouter;
