const express = require("express");
const Diary = require("../models/diary");
const User = require("../models/user");
const {
  dateSchema,
  getDiarySchema,
  postSchema,
} = require("../models/validationschema");
//const User = require("../models/user");
const diaryrouter = express.Router();
const config = require("../utils/config");
const middleware = require("../utils/middleware");
const validate = require("../utils/validate");
const logger = require("../utils/logger");
const imaps = require("imap-simple");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

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
    for (const item of messages) {
      const rawEmailContentHead = item.parts.find(
        (part) => part.which === "HEADER"
      ).body;
      let emailaddress = rawEmailContentHead["from"][0];
      emailaddress = emailaddress.split(" ");
      emailaddress = emailaddress[emailaddress.length - 1];
      emailaddress = emailaddress.slice(1, emailaddress.length - 1);
      let subject = rawEmailContentHead["subject"][0].toLowerCase();
      let boundary = rawEmailContentHead["content-type"][0].split(`"`);
      boundary = boundary[1];
      let text;
      if (subject.includes("diary") || subject.includes("daily reminder")) {
        const rawEmailContentText = item.parts.find(
          (part) => part.which === "TEXT"
        ).body;
        if (rawEmailContentText.includes(boundary)) {
          //for new mails from systems
          text = rawEmailContentText.split(boundary);
          text = text[1];
          text = text.replace(
            /Content-Type: text\/plain; charset="UTF-8"\r?\n\r?\n/,
            ""
          );
          text = text.slice(0, text.lastIndexOf("--"));
          if (text.includes("@gmail.com>")) {
            //for mail replied to instead of creating a new mail
            text = String(text.split("@gmail.com>")[0]);
            text = text.split("Content-Transfer-Encoding: quoted-printable")[1];
            text = text.split("\n");
            text.pop();
            text = text.join("\n");
          }
          text = text.trim();
        } else {
          //for mail from phones
          text = rawEmailContentText;
          text = text.trim();
        }
        try {
          if (emailaddress) {
            const user = await User.findOne({ email: emailaddress });
            if (!(user && user.verified)) {
              logger.info(`A log was attempted by ${emailaddress}`);
              mailOptions = {
                from: config.EMAIL_USER,
                to: emailaddress,
                subject: "Failed to save Diary",
                html: `<p>Either user is not registered or not verified, <b>Log into diary dove to rectify</b> </p>`,
              };
            } else {
              const diary = new Diary({ userId: user._id, content: text });
              logger.info(`A log has been succesfully saved by ${user._id}`);
              await diary.save();
              mailOptions = {
                from: config.EMAIL_USER,
                to: emailaddress,
                subject: `Diary successfully logged`,
                html: `<p>Diary has been saved to the server.</p>`,
              };
            }
          }
        } catch (error) {
          logger.error(
            `An error occured while attemptin to save a diary from ${user._id}`
          );
          mailOptions = {
            from: config.EMAIL_USER,
            to: emailaddress,
            subject: "An error occured",
            html: `<p>Error occured on the server please resend your diary or log in to diary dove to log in app </p>`,
          };
        }
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS,
          },
        });
        try {
          await transporter.sendMail(mailOptions);
          logger.info("Email sent");
        } catch (error) {
          logger.error("Error sending email:", error);
        }
      }
    }
    connection.end();
  } catch (error) {
    logger.error("Error fetching emails:", error);
  }
};

//
cron.schedule("*/5 * * * *", async () => {
  logger.info("Running a task every 5 minutes to fetch emails");
  await fetchEmails();
});

// Add Diary Entry
diaryrouter.post(
  "/",
  validate(postSchema),
  middleware.verifyToken,
  async (req, res) => {
    const { content } = req.body;
    try {
      const diary = new Diary({ userId: req.userId, content });
      logger.info(`A log has been succesfully saved by ${req.userId}`);
      await diary.save();
      return res.status(201).json({
        status: "success",
        message: "Diary succesfully saved",
        data: diary,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
        error: "Internal Server Error",
      });
    }
  }
);

// Get All Diary Entries
diaryrouter.get(
  "/",
  validate(getDiarySchema),
  middleware.verifyToken,
  async (req, res) => {
    const { startDate, endDate, limit, page } = req.body;
    const paginationLimit = limit || 12;
    const paginationPage = page || 1;
    try {
      const diaries = await Diary.find({ userId: req.userId })
        .sort({ date: -1 })
        .limit(paginationLimit)
        .skip((paginationPage - 1) * paginationLimit);
      return res.status(200).json({
        status: "success",
        message: "Diaries succesfully retrieved",
        data: diaries,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
        error: "Internal Server Error",
      });
    }
  }
);

// Filter Diary Entries by Date Range
diaryrouter.get(
  "/filter",
  validate(dateSchema),
  middleware.verifyToken,
  async (req, res) => {
    const { startDate, endDate, limit, page } = req.body;
    const paginationLimit = limit || 12;
    const paginationPage = page || 1;
    try {
      const diaries = await Diary.find({
        userId: req.userId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })
        .sort({ date: -1 })
        .limit(paginationLimit)
        .skip((paginationPage - 1) * paginationLimit);
      return res.status(200).json({
        status: "success",
        message: "Diaries succesfully retrieved",
        data: diaries,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
        error: "Internal Server Error",
      });
    }
  }
);

//Get a single diary with its id
diaryrouter.get("/:id", middleware.verifyToken, async (req, res) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  const diary_id = req.params.id;
  try {
    const diary = await Diary.findById({ _id: diary_id });
    if (!diary) {
      return res.status(200).json({
        status: "success",
        message: "Diary is not in database",
        data: "",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Diary succesfully retrieved",
      data: diary,
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
});

//edit a diary
diaryrouter.patch("/:id", middleware.verifyToken, async (req, res) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  const diary_id = req.params.id;
  const { content } = req.body;
  try {
    const diary = await Diary.findById({ _id: diary_id });
    diary.content = content;
    logger.info("Saved edited diary ${diary_id} by user {req.userId}");
    await diary.save();
    return res.status(200).json({
      status: "success",
      message: "Diaries succesfully edited",
      data: diary,
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
});

//Delete a diary
diaryrouter.delete("/delete/:id", middleware.verifyToken, async (req, res) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  const diary_id = req.params.id;
  try {
    if (!diary_id) {
      throw error;
    }
    await Diary.deleteOne({ _id: diary_id });
    logger.info(`Diary ${diary_id} deleted by user {req.userId}`);
    return res.status(200).json({
      status: "success",
      message: "Diaries deleted edited",
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
});

//Delete all diaries
diaryrouter.delete("/deleteall", middleware.verifyToken, async (req, res) => {
  try {
    logger.info(`All diaries  deleted by user ${req.userId}`);
    await Diary.deleteMany({});
    return res.status(200).json({
      status: "success",
      message: "All diary entries deleted",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

module.exports = { diaryrouter, fetchEmails };
