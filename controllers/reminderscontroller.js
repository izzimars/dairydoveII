const reminderBot = require("./reminderbots");
const logger = require("../utils/logger");
const reminderServices = require("../services/reminderServices");
const schedule = require("node-schedule");

// getting all reminders
const getReminders = async (req, res, next) => {
  try {
    const reminders = await reminderServices.findUserReminder({
      userId: req.userId,
    });
    const retunedRems = reminders.map((i) => {
      const transformedI = i.toJSON();
      return { id: transformedI.id, hour: i.hour, time: i.time };
    });
    return res.status(200).json({
      status: "success",
      message: "Reminders successfully retrieved",
      data: retunedRems,
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
    let dbArr = await reminderServices.findUserReminder({ userId: req.userId });
    for (const time of reminders) {
      let arr = await reminderBot.timeSplitter(time);
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
        let hourmins = await reminderBot.timeSplitter(time);
        let newReminder = await reminderServices.createReminder(
          req.userId,
          hourmins[0],
          hourmins[1]
        );
        if (typeof newReminder == "string" && newReminder == "Max") {
          return res.status(200).json({
            status: "success",
            message: `Maximum number of reminder reached`,
          });
        }
        logger.info(`The reminder has been set for ${newReminder._id}`);
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
    logger.error("Reminder/Addnew:", err);
    next(err);
  }
};

//delete a reminder
const deleteReminders = async (req, res, next) => {
  try {
    await reminderServices.deleteReminder({ _id: req.params.id });
    return res.status(200).json({
      status: "success",
      message: "Reminder successfully deleted",
    });
  } catch (err) {
    logger.error("Reminders/deleteReminders:", err);
    next(err);
  }
};

module.exports = { addReminders, getReminders, deleteReminders };
