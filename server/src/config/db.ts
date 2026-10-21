import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is required");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected : ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
