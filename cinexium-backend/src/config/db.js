import mongoose from "mongoose"
import dns from "dns"

// Force Google DNS to bypass local DNS blocking MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.log("Mongo Error", error);
        process.exit(1);
    }
}

