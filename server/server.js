import express from "express";
import jwt from "jsonwebtoken";
import connectDb from "./config/db.js";
import bcrypt from "bcrypt";
import User from "./models/userSchema.js";
import cors from 'cors';
const app = express();
connectDb();

app.use(express.json());


app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,              
}));

app.post("/user/signup", async (req, res) => {
  try {
    const user = req.body;
    const userPassword = user.password;

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: user.email });
    console.log(existingUser);
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create the new and updating the password
    const newUser = new User({
      ...user,
      password: hashedPassword,
    });

    //saving the new user
    await newUser.save();
    console.log(newUser);

    res.status(201).send("User created successfully");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //checking if the user exists or not
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).send("User doesn't exist. Check your email.");
    }

    //checkig if the password is correct or not
    const isCheck = await bcrypt.compare(password, existingUser.password);
    if (!isCheck) {
      return res.status(401).send("Invalid credentials. Check your password.");
    }

    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    // sending token to thr frontend url
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).send("Login Successful !!");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

app.post("/user/logout", async (req, res) => {
  try {
    res.clearCookie("token"); //removing cookie so that user token got expired
    res.status(200).send("Logged out successfully");
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});  