const Reminder = require("../models/remindermodel");
const logger = require("../utils/logger");

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

const findReminderByOne = async (remId) => {
  try {
    const rem = await Reminder.findOne({ remId });
    logger.info(`Remainder ${remId._id} successfully found`);
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
    const reminder = await Reminder.findOne({ reminderId });
    const job = schedule.scheduledJobs[reminder._id];
    if (job) {
      job.cancel();
    }
    await Reminder.findByIdAndDelete(reminder._id);
    logger.info(`Reminder ${newReminder._id} deleted.`);
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

module.exports = {
  findReminderByOne,
  findReminderById,
  createReminder,
  deleteReminder,
};
