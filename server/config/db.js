import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

// Corrected function name
const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    
        console.log('Database connected successfully'); 
        
    } catch (error) {
      
        console.log('Error in your database:', error); 
    }
}

export default connectDb;