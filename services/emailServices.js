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
    const subject = "Verify Your Email";
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`
    const html = `
      <div style="background-color: #f0f0f0; padding: 20px;">
        <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
            <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
          </div>
          <h3>Email Verification</h3>
          <p>Enter <b>${otp}</b> in the app to complete your verification. OTP expires in 6 minutes.</p>
          <p>Ignore this message if you have already been verified.</p>
        </section>
      </div>`;
    await sendEmail(user_email, subject, "", html);
    console.log(otp)
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
};

module.exports = { sendOtpEmail, sendEmail };

