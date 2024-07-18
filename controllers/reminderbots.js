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
    const user = await userServices.findUserByOne(reminder.userId);
    if (!user) {
      throw new Error(`User with ID ${reminder.user} not found`);
    }
    logger.info(
      `User found: ${user._id}, scheduling job for ${rule.hour}:${rule.minute}:${rule.second}`
    );
    schedule.scheduleJob(rule, () => {
      logger.info(`Reminder job running for user ${user._id}`);
      let text = `Hello ${user.username}, it is time for a new diary entry in your personal dove diary. \n 
        Make your new entries here and view them on your dashboard later.`;
      emailServices.sendEmail(user.email, (subject = text));
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
    hour = divTime[0];
  } else {
    let temp_hour = Number(divTime[0]) + 12;
    hour = temp_hour < 24 ? temp_hour : 0;
  }
  return [hour, Number(divTime[1])];
};

module.exports = {
  timeSplitter,
  scheduleAllReminders,
};
