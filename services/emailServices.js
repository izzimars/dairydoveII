const logger = require("../utils/logger");
const nodemailer = require("nodemailer");
const config = require("../utils/config");
const imaps = require("imap-simple");
const userServices = require("../services/userService");
const diaryServices = require("../services/diaryServices");

//email reciever configuration
const emailconfig = {
  imap: {
    user: config.EMAIL_USER, // Use the actual user email
    password: config.EMAIL_PASS, // Use the actual user password
    host: "imap.gmail.com", // Adjust based on the email provider
    port: 993,
    tls: true,
    authTimeout: 5000,
    tlsOptions: { rejectUnauthorized: false },
  },
};

//Fetch all email function
const fetchEmails = async () => {
  try {
    const connection = await imaps.connect(emailconfig);
    await connection.openBox("INBOX");
    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };
    const messages = await connection.search(searchCriteria, fetchOptions);
    connection.end();
    return messages;
  } catch (err) {
    logger.info("Fetching email error: ", err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const extractText = (item) => {
  const rawEmailContentHead = item.parts.find(
    (part) => part.which === "HEADER"
  ).body;
  let emailaddress = rawEmailContentHead["from"][0];
  emailaddress = emailaddress.split(" ");
  emailaddress = emailaddress[emailaddress.length - 1];
  emailaddress = emailaddress.slice(1, emailaddress.length - 1);
  let subject = rawEmailContentHead["subject"][0].toLowerCase();
  let boundary = rawEmailContentHead["content-type"][0].split(`"`)[1];
  let text;

  if (subject.includes("diary") || subject.includes("daily reminder")) {
    const rawEmailContentText = item.parts.find(
      (part) => part.which === "TEXT"
    ).body;
    if (rawEmailContentText.includes(boundary)) {
      text = rawEmailContentText.split(boundary)[1];
      text = text
        .replace(/Content-Type: text\/plain; charset="UTF-8"\r?\n\r?\n/, "")
        .slice(0, text.lastIndexOf("--"));

      if (text.includes("@gmail.com>")) {
        text = String(
          text
            .split("@gmail.com>")[0]
            .split("Content-Transfer-Encoding: quoted-printable")[1]
        );
        text = text.split("\n");
        text.pop();
        text = text.join("\n");
      }
      text = text.trim();
    } else {
      text = rawEmailContentText.trim();
    }
    return [text, emailaddress];
  }
  return [null, null];
};

const emailHandler = async (messages) => {
  for (const item of messages) {
    const [text, emailaddress] = extractText(item);
    if (emailaddress) {
      try {
        const user = await userServices.findUserByOne("email", emailaddress);
        if (!user || !user.verified) {
          await sendNullUserEmail(emailaddress);
          logger.info(`A log was attempted by ${emailaddress}`);
        } else {
          await diaryServices.createDiary({ userId: user._id, content: text });
          await sendSucUserEmail(emailaddress);
          logger.info(`A log was saved for ${emailaddress}`);
        }
      } catch (error) {
        logger.error(
          `An error occurred for user ${emailaddress}: ${error.message}`
        );
        try {
          await sendFaiUserEmail(emailaddress);
        } catch (err) {
          logger.error("An error occurred at email handler: ", err);
        }
      }
    }
  }
};

//Send Emails
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
    logger.info("email is sent succesfully");
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
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
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
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
};

const sendNullUserEmail = async (user_email) => {
  try {
    const subject = "Failed to save Diary";
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
    const html = `
    <div style="background-color: #f0f0f0; padding: 20px;">
      <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
          <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
        </div>
        <h3>Failed to save Diary</h3>
        <p>Either user is not registered or not verified, <b>Log into diary dove to rectify</b> </p>
        <p>Ignore this message if you have already been verified.</p>
      </section>
    </div>`;
    await sendEmail(user_email, subject, "", html);
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
};

const sendSucUserEmail = async (user_email) => {
  try {
    const subject = `Diary successfully logged`;
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
    const html = `
    <div style="background-color: #f0f0f0; padding: 20px;">
      <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
          <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
        </div>
        <h3>Diary successfully logged</h3>
        <p>Diary has been successfully logged.</p>
      </section>
    </div>`;
    await sendEmail(user_email, subject, "", html);
  } catch (err) {
    logger.error(err.message);
    throw err;
  }
};

const sendFaiUserEmail = async (user_email) => {
  try {
    const subject = "An error occured";
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
    const html = `
    <div style="background-color: #f0f0f0; padding: 20px;">
      <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
          <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
        </div>
        <h3>An error occured</h3>
        <p>Error occured on the server please resend your diary or sign in to diary dove to log your entry </p>
      </section>
    </div>`;
    await sendEmail(user_email, subject, "", html);
  } catch (err) {
    logger.error("Error occured while sending failure email: ", err.message);
    throw err;
  }
};

const sendRemUserEmail = async (useremail, username) => {
  try {
    const subject = "Daily Reminder";
    const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
    const html = `
    <div style="background-color: #f0f0f0; padding: 20px;">
      <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
          <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
        </div>
        <h3>Daily Reminder</h3>
        <p>It is time to take a break and be one with your thoughts. Diary Dove is reminding you log a diary entry now.<br/>
        Reply this message or sign into the app to load your entry</p>
        <p>Ignore this message if you have already been logged your reminder for this time.</p>
      </section>
    </div>`;
    await sendEmail(user_email, subject, "", html);
  } catch (err) {
    logger.error("Error occured while sending failure email: ", err.message);
    throw err;
  }
};

module.exports = {
  sendOtpEmail,
  sendEmail,
  sendNullUserEmail,
  sendSucUserEmail,
  sendFaiUserEmail,
  fetchEmails,
  emailHandler,
};
