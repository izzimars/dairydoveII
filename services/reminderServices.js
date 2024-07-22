const Reminder = require("../models/remindermodel");
const logger = require("../utils/logger");
const schedule = require("node-schedule");

const findReminderById = async (remId) => {
  try {
    const rem = await Reminder.findById({ _id: remId });
    console.log(rem);
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
    return rem;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const createReminder = async (userId, hour, mins) => {
  try {
    const newReminder = new Reminder({
      userId: userId,
      hour: hour,
      time: mins,
    });
    await newReminder.save();
    logger.info(`Reminder saved for ${newReminder._id}`);
    return newReminder;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const deleteReminder = async (reminderId) => {
  try {
    const reminder = await Reminder.findOne(reminderId);
    console.log(reminder);
    if (reminder) {
      const job = schedule.scheduledJobs[reminder._id];
      console.log(job);
      if (job) {
        job.cancel();
      }
      const delt = await Reminder.findByIdAndDelete(reminder._id);
      console.log(delt);
      logger.info(`Reminder ${reminder._id} deleted.`);
    }
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

module.exports = {
  findUserReminder,
  findReminderById,
  createReminder,
  deleteReminder,
};
