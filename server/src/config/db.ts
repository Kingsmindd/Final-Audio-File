import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected : ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
// umehjnr041_db_user
//y4WLrPbjXIvAQ3Lb
//  mongodb+srv://umehjnr041_db_user:y4WLrPbjXIvAQ3Lb@cluster0.veqd9kk.mongodb.net/?appName=Cluster0
