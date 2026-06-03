import mongoose from 'mongoose';

// Cache connection state across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  if (uri) {
    // Strip surrounding quotes and whitespace from copy-paste
    uri = uri.trim().replace(/^["']|["']$/g, '');
  }

  if (!uri) {
    const errMsg = 'MONGO_URI is missing! Please configure it in your Vercel project settings.';
    console.error(errMsg);
    throw new Error(errMsg);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const redactedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`Connecting to MongoDB Atlas (new connection): ${redactedUri}`);

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected successfully!');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`Database Connection Error: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

export default connectDB;
