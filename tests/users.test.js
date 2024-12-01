const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const usersRouter = require("../routes/api/users");

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("User Authentication", () => {
  let server;

  beforeAll((done) => {
    console.log("Starting server and connecting to database...");
    server = app.listen(3000, async () => {
      await mongoose.connect("mongodb://localhost:27017/testdb");
      console.log("Connected to database");
      done();
    });
  }, 30000); // Increase timeout to 30 seconds

  afterAll((done) => {
    console.log("Closing database connection and server...");
    mongoose.connection.close(() => {
      server.close(() => {
        console.log("Closed database connection and server");
        done();
      });
    });
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(async () => {
    console.log("Creating test user...");
    const user = new User({
      email: "test@example.com",
      password: "password123", // Password will be hashed by the pre-save hook
      subscription: "starter",
    });
    await user.save();
    console.log("Test user created");
  });

  afterEach(async () => {
    console.log("Deleting test users...");
    await User.deleteMany({});
    console.log("Test users deleted");
  });

  it("should return 200 and a token with user object", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", "test@example.com");
    expect(res.body.user).toHaveProperty("subscription", "starter");
  }, 10000); // Increase timeout to 10 seconds

  it("should return 401 for incorrect password", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).not.toHaveProperty("token");
    expect(res.body.message).toBe("Email or password is wrong");
  }, 10000); // Increase timeout to 10 seconds

  it("should return 401 for non-existent user", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).not.toHaveProperty("token");
    expect(res.body.message).toBe("Email or password is wrong");
  }, 10000); // Increase timeout to 10 seconds

  it("should return 400 for missing email", async () => {
    const res = await request(app).post("/api/users/login").send({
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('"email" is required');
  }, 10000); // Increase timeout to 10 seconds

  it("should return 400 for missing password", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "test@example.com",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('"password" is required');
  }, 10000); // Increase timeout to 10 seconds
});

// To run these tests, use the following command in your terminal:
// npx jest tests/users.test.js --detectOpenHandles
