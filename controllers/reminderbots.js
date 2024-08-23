const schedule = require("node-schedule");
const Reminder = require("../models/remindermodel");
const logger = require("../utils/logger");
const emailServices = require("../services/emailServices");
const userServices = require("../services/userService");
const whatsappServices = require("../services/whatsappservices");
const { ObjectId } = require("mongodb");

const scheduleReminder = async (reminder) => {
  try {
    logger.info("A job is being created for the reminder");
    const rule = new schedule.RecurrenceRule();
    rule.hour = reminder.hour;
    rule.minute = reminder.time;
    let user = await userServices.findUserById(reminder.userId);
    if (!user) {
      logger.info(`User with ID ${reminder.userId} not found`);
      return "None";
    }
    logger.info(
      `User found: ${user._id}, scheduling job for ${rule.hour}:${rule.minute}:${rule.second}`
    );
    let shedRem = schedule.scheduleJob(rule, async () => {
      logger.info(`Reminder job running for user ${user._id}`);
      const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
      const html = `
        <div style="background-color: #f0f0f0; padding: 20px;max-width: 640px;margin:auto;">
        <section style="max-width: 600px; margin: auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="display:block;"><img src= "${logoURL}" alt="Diary Dove logo" style="width:43px; height:36px; display:inline;">
            <h1 style="color: #DA9658; display:inline; ">Dairy Dove</h2>
          </div>
          <h3>Daily Reminder</h3>
          <p>It is time to take a break and be one with your thoughts. Diary Dove is reminding you to log a diary entry now.<br/>
          Reply this message or sign into the app to load your entry</p>
          <p>Ignore this message if you have logged your entry for this time.</p>
        </section>
      </div>`;
      if (user.verified) {
        await emailServices.sendEmail(
          user.email,
          (subject = "Daily Reminder"),
          "",
          html
        );
      }
      if (user.whatsappverified)
        await whatsappServices.sendReminderBot(user.phonenumber, user.username);
    });
    return shedRem.name;
  } catch (error) {
    logger.error(`Error scheduling reminder: ${error}`);
    error.status = 500;
    throw error;
  }
};

// Example of adding a new reminder to the database
const timeSplitter = async (time) => {
  const divTime = time.split(/[: ]/);
  let hour = Number(divTime[0]);
  const minutes = Number(divTime[1]);
  const period = divTime[2] ? divTime[2].toLowerCase() : null;
  if (
    isNaN(hour) ||
    isNaN(minutes) ||
    (period && period !== "am" && period !== "pm")
  ) {
    const error = new Error("Bad request, Invalid time format");
    error.status = 400;
    throw error;
  }
  if (hour > 12 && period) {
    const error = new Error("Bad request, Invalid time format");
    error.status = 400;
    throw error;
  }
  if (period === "pm" && hour !== 12) {
    hour += 12;
  } else if (period === "am" && hour === 12) {
    hour = 0;
  }
  if (period === null && hour >= 24) {
    const error = new Error("Bad request, Invalid time format");
    error.status = 400;
    throw error;
  }
  return [hour, minutes];
};

module.exports = {
  timeSplitter,
  scheduleReminder,
};
