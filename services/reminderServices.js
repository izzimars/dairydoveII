const Reminder = require("../models/remindermodel");
const logger = require("../utils/logger");
const schedule = require("node-schedule");
const reminderBot = require("../controllers/reminderbots");

const findReminderById = async (remId) => {
  try {
    const rem = await Reminder.findById({ _id: remId });
    logger.info(`Remainder ${remId} successfully found`);
    return rem;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const findUserReminder = async (value) => {
  try {
    const rem = await Reminder.find(value);
    // rem.map((i) => {
    //   i.hour = i.hour + 1 >= 24 ? 0 : i.hour + 1;
    //   return i;
    // });
    return rem;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const createReminder = async (userId, hour, mins) => {
  const rem = await Reminder.find({ userId: userId });
  if (rem.length >= 3) {
    return `Max`;
  }
  for (const time of rem) {
    if (time.hour == hour && time.time == mins) {
      return "Dup";
    }
  }
  try {
    let newReminder = new Reminder({
      userId: userId,
      hour: hour,
      time: mins,
    });
    let jobId = await reminderBot.scheduleReminder(newReminder);
    newReminder.jobId = jobId;
    await newReminder.save();
    logger.info(`Reminder saved for ${newReminder.userId}`);
    return newReminder;
  } catch (err) {
    logger.info("createReminder", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const deleteReminder = async (reminderId) => {
  try {
    const reminder = await Reminder.findOne(reminderId);
    if (reminder) {
      const job = schedule.scheduledJobs[reminder.jobId];
      if (job) {
        logger.info("Deleting reminder job");
        job.cancel();
      }
      await Reminder.findByIdAndDelete(reminder._id);
      logger.info(`Reminder ${reminder._id} deleted.`);
    }
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

// Function to fetch reminders from database and schedule them
const scheduleAllReminders = async () => {
  try {
    const reminders = await Reminder.find({});
    for (const reminder of reminders) {
      let newJobId = await reminderBot.scheduleReminder(reminder);
      reminder.jobId = newJobId;
      await reminder.save();
    }
    logger.info("All reminders scheduled.");
  } catch (err) {
    logger.error("Error fetching reminders:", err);
    err.status = 500;
    throw err;
  }
};

scheduleAllReminders();
module.exports = {
  findUserReminder,
  findReminderById,
  createReminder,
  deleteReminder,
};
