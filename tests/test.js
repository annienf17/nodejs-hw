const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendVerificationEmail(email, token) {
  const verificationUrl = `http://localhost:3000/api/users/verify/${token}`;
  const msg = {
    to: email,
    from: "a.ulanskaxxi@gmail.com", // Użyj zweryfikowanego adresu email
    subject: "Verify your email",
    text: "Please verify your email by clicking the link below:",
    html: `Please verify your email by clicking <a href="${verificationUrl}">here</a>.`,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Verification email sent");
    })
    .catch((error) => {
      console.error("Error sending verification email:", error);
      console.error("Response body:", error.response.body);
    });
}

// Przykładowe dane do testowania
const testEmail = "recipient@example.com"; // Zmień na adres email odbiorcy
const testToken = "test-token"; // Przykładowy token weryfikacyjny

// Wywołanie funkcji do wysłania emaila weryfikacyjnego
sendVerificationEmail(testEmail, testToken);
