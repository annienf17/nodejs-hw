const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const usersRouter = require("../routes/api/users");

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("User API", () => {
  let server;
  let user;
  let token;

  beforeAll(async () => {
    server = app.listen(3001);
    await mongoose.connect("mongodb://localhost:27017/testdb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    user = new User({
      email: "test@example.com",
      password: "password123",
      subscription: "starter",
      verify: true,
    });
    await user.save();
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/users/signup", () => {
    it("should return 201 and the user object with token", async () => {
      const res = await request(app)
        .post("/api/users/signup")
        .send({ email: "newuser@example.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty("email", "newuser@example.com");
      expect(res.body.user).toHaveProperty("subscription", "starter");
    }, 10000); // Increase timeout to 10 seconds
  });

  describe("POST /api/users/login", () => {
    it("should return 200 and the user object with token", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", "test@example.com");
      expect(res.body.user).toHaveProperty("subscription", "starter");
    }, 10000); // Increase timeout to 10 seconds
  });
});
