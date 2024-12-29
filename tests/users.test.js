const sgMail = require("@sendgrid/mail");
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");
const usersRouter = require("../routes/api/users");
require("dotenv").config();

const uri = process.env.MONGODB_URI;

jest.setTimeout(30000);

// Mock SendGrid mail
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue({}),
}));

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("User API", () => {
  let server;
  let user;
  let token;

  beforeAll(async () => {
    server = app.listen(3001, () =>
      console.log("Test server running on port 3001")
    );
    await mongoose.connect(uri, {
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
      verificationToken: jwt.sign(
        { id: "testId" },
        process.env.JWT_SECRET || "testsecret"
      ),
    });
    await user.save();
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "testsecret", {
      expiresIn: "1h",
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("Email Verification", () => {
    it("should send a verification email", async () => {
      const sendEmailMock = jest
        .spyOn(sgMail, "send")
        .mockResolvedValueOnce({});
      const verificationToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "testsecret"
      );
      await sgMail.send({
        to: "test@example.com",
        subject: "Verify your email",
        text: `Token: ${verificationToken}`,
      });

      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("Verify your email"),
        })
      );
    });

    it("should return 200 on successful email verification", async () => {
      const res = await request(app).get(
        `/api/users/verify/${user.verificationToken}`
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Verification successful");
    });

    it("should return 404 if user not found during email verification", async () => {
      const res = await request(app).get("/api/users/verify/invalidtoken");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should allow resending verification email", async () => {
      const newUser = await User.findOneAndUpdate(
        { email: "test@example.com" },
        { verify: false },
        { new: true }
      );

      const res = await request(app)
        .post("/api/users/verify")
        .send({ email: newUser.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Verification email sent");
    });

    it("should return 400 if email is already verified", async () => {
      const res = await request(app)
        .post("/api/users/verify")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Verification has already been passed");
    });
  });
});
