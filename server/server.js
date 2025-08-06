import express from "express";
import jwt from "jsonwebtoken";
import connectDb from "./config/db.js";
import bcrypt from "bcrypt";
import User from "./models/userSchema.js";

const app = express();
connectDb();

app.use(express.json());

app.post("/user/signup", async (req, res) => {
  try {
    const user = req.body;
    const userPassword = user.password;

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: user.email });
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
    const user = req.body;
    //checking if email exist or not
    if (!(await User.findOne(user.email))) {
      res.status(400).send("user doesn't exist check your mail");
    }

    const userPassword = user.password;
    
  } catch (error) {}
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
