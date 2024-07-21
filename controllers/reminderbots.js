const schedule = require("node-schedule");
const Reminder = require("../models/remindermodel");
const logger = require("../utils/logger");
const emailServices = require("../services/emailServices");
const userServices = require("../services/userService");

const scheduleReminder = async (reminder) => {
  try {
    logger.info("A job is being created for the reminder");
    const rule = new schedule.RecurrenceRule();
    rule.hour = reminder.hour;
    rule.minute = reminder.time;
    const user = await userServices.findUserByOne("_id", reminder.userId);
    if (!user) {
      throw new Error(`User with ID ${reminder.user} not found`);
    }
    logger.info(
      `User found: ${user._id}, scheduling job for ${rule.hour}:${rule.minute}:${rule.second}`
    );
    schedule.scheduleJob(rule, async () => {
      logger.info(`Reminder job running for user ${user._id}`);
      const logoURL = `https://res.cloudinary.com/dwykmvdhb/image/upload/v1721222788/xn1fblohfrvwopzcmaq3.png`;
      const html = `
        <div style="background-color: #f0f0f0; padding: 20px;max-width: 640px;margin:auto;">
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
      await emailServices.sendEmail(
        user.email,
        (subject = "Daily Reminder"),
        "",
        html
      );
    });
  } catch (error) {
    logger.error(`Error scheduling reminder: ${error}`);
    error.status = 500;
    throw error;
  }
};

// Function to fetch reminders from database and schedule them
const scheduleAllReminders = async () => {
  try {
    const reminders = await Reminder.find({});
    reminders.forEach((reminder) => {
      scheduleReminder(reminder);
    });
    logger.info("All reminders scheduled.");
  } catch (err) {
    logger.error("Error fetching reminders:", err);
    err.status = 500;
    throw err;
  }
};

// Example of adding a new reminder to the database
const timeSplitter = async (time) => {
  let hour;
  const divTime = time.split(/[: ]/);
  if (divTime[2] == "am") {
    hour = Number(divTime[0]);
  } else {
    let temp_hour = Number(divTime[0]) + 12;
    hour = temp_hour < 24 ? temp_hour : 0;
  }
  return [hour, Number(divTime[1])];
};

module.exports = {
  timeSplitter,
  scheduleAllReminders,
  scheduleReminder,
};
