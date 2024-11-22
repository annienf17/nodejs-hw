const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/users/signup", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/users/signup").send({
      email: "example@example.com",
      password: "examplepassword",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", "example@example.com");
    expect(res.body.user).toHaveProperty("subscription", "starter");
  });

  it("should return validation error for invalid email", async () => {
    const res = await request(app).post("/api/users/signup").send({
      email: "invalid-email",
      password: "examplepassword",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return conflict error for existing email", async () => {
    await new User({
      email: "example@example.com",
      password: "examplepassword",
    }).save();

    const res = await request(app).post("/api/users/signup").send({
      email: "example@example.com",
      password: "examplepassword",
    });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty("message", "Email in use");
  });
});
