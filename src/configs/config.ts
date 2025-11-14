import mongoose from 'mongoose';

// Helper function to connect to MongoDB using MONGO_URI from .env
export const connectDB = async (): Promise<void> => {
    // Read connection string from environment variable
    const uri = process.env.MONGO_URI;

    if (!uri) {
        // If variable is missing - throw an error
        throw new Error('MONGO_URI is not set');
    }

    try {
        // Try to establish a connection to MongoDB
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (err) {
        // Log error and rethrow to be handled in caller
        console.error('MongoDB connection error:', (err as Error).message);
        throw err;
    }
};
