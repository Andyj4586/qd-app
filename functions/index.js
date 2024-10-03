// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Retrieve Gmail credentials from environment variables
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Create a Nodemailer transporter using Gmail SMTP
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// Cloud Function to send a welcome email upon user creation
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const email = user.email; // User's email address
  const displayName = user.displayName || "User"; // User's display name

  const mailOptions = {
    from: `"Q'd Team" <${gmailEmail}>`,
    to: email,
  };

  // Email subject and body
  mailOptions.subject = "Welcome to Q'd!";
  mailOptions.text = `Hello ${displayName},

  Welcome to Q'd! We're excited to have you on board.
  
  Best regards,
  The Q'd Team`;
  mailOptions.html = `<p>Hello ${displayName},</p>
         <p>Welcome to <strong>Q'd</strong>! We're excited to have you here.</p>
         <p>Best regards,<br/>The Q'd Team</p>`;

  return mailTransport.sendMail(mailOptions)
      .then(() => {
        console.log("Welcome email sent to:", email);
        return null;
      })
      .catch((error) => {
        console.error("Error sending welcome email:", error);
        return null;
      });
});
