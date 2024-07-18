const express = require("express");
const reminderBot = require("./reminderbots");
const remindersroute = express.Router();
const reminderServices = require("../services/reminderServices");

// getting all reminders
const getReminders = async (req, res, next) => {
  try {
    const reminders = await reminderServices.findReminderById(req.userId);
    return res.status(200).json({
      status: "success",
      message: "Reminders successfully retrieved",
      data: reminders,
    });
  } catch (err) {
    console.error("Error creating reminder", err);
    logger.error("Diary/Post:", err);
    next(err);
  }
};

//add new reminder
const addReminders = async (req, res, next) => {
  let reminders = req.body.times;
  let newreminders = [];
  try {
    let timeArr = [];
    let convDbArr = [];
    let dbArr = await reminderServices.findReminderById(req.userId);
    for (const time of reminders) {
      let arr = reminderBot.timeSplitter(time);
      timeArr.push(arr);
    }
    for (let i = 0; i < dbArr.length; i++) {
      let arr = [dbArr[i].hour, dbArr[i].time];
      convDbArr.push(arr);
    }
    for (let i = 0; i < timeArr.length; i++) {
      let flag = false;
      for (let j = 0; j < convDbArr.length; j++) {
        if (
          timeArr[i].every((element, index) => {
            return element === convDbArr[j][index];
          })
        ) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        newreminders.push(reminders[i]);
      }
    }
    if (newreminders.length != 0) {
      var suc = 0;
      for (const time of newreminders) {
        let hourmins = remainderBot.timeSplitter(time);
        await reminderServices.createReminder(
          res.userId,
          hourmins[0],
          hourmins[1]
        );
        suc += 1;
      }
      return res.status(200).json({
        status: "success",
        message: `${suc} remainders successfully added`,
      });
    } else {
      return res.status(200).json({
        status: "success",
        message: `Reminders already exists`,
      });
    }
  } catch (err) {
    console.error("Error deleting reminders", err);
    logger.error("Diary/Post:", err);
    next(err);
  }
};

//delete a reminder
const deleteReminders = async (req, res, next) => {
  const reminderId = req.params;
  try {
    await reminderServices.deleteReminder(reminderId);
    return res.status(200).json({
      status: "success",
      message: "Reminder successfully deleted",
    });
  } catch (err) {
    console.error("Error deleting reminders", err);
    logger.error("Diary/Post:", err);
    next(err);
  }
};

module.exports = { addReminders, getReminders, deleteReminders };
