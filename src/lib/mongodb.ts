import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;

    // ✅ Lazy runtime check
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }

    // Optional debug (safe logging)
    console.log(
        "MONGODB: URI detected (masked):",
        MONGODB_URI.substring(0, 15) + "..." + (MONGODB_URI.split('@')[1] || "")
    );

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 20000,
        };

        console.log("MONGODB: Initializing new connection...");

        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongoose) => {
                console.log("MONGODB: Connection established.");
                return mongoose;
            })
            .catch(err => {
                console.error("MONGODB: Connection failed:", err.message);
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;