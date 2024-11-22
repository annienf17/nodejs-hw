const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const User = require("../../models/User");

const router = express.Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

router.post("/signup", async (req, res) => {
  const { error } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    res
      .status(201)
      .json({ user: { email: user.email, subscription: user.subscription } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
