const logger = require("../utils/logger");
const nodemailer = require("nodemailer");
const config = require("../utils/config");

const sendEmail = async (
  userEmail,
  subject = "Daily Reminder",
  reminderText = "",
  htmltext = ""
) => {
  try {
    const mailOptions = {
      from: config.EMAIL_USER,
      to: userEmail,
      subject: subject,
      text: reminderText,
      html: htmltext,
    };

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.error(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const sendOtpEmail = async (user_email, otp) => {
  try {
    subject = "Verify Your Email";
    html = `<p>Enter <b>${otp}</b> in the app to complete your verification.</p>. OTP expires in 6 minutes</p>`;
    await sendEmail(user_email, subject, html);
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
};

module.exports = { sendOtpEmail, sendEmail };
