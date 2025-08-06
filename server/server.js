import express from 'express';
import jwt from 'jsonwebtoken';
import connectDb from './config/db.js'

const app = express();
connectDb();

app.use(express.json());

app.post('/signup',async (req,res)=>{
    const user = req.body;
    console.log(user);
    
})

const port = 3000;
app.listen(port,()=>{
    console.log(`Server is running at ${port}`);
    
});