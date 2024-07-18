const express = require("express");
const { dateSchema, getDiarySchema, postSchema } = require("../utils/validate");
//const User = require("../models/user");
const diaryrouter = express.Router();
const middleware = require("../utils/middleware");
const validate = require("../utils/validate");
const logger = require("../utils/logger");
const cron = require("node-cron");
const diaryServices = require("../services/diaryServices");
const emailServices = require("../services/emailServices");

cron.schedule("*/1 * * * *", async () => {
  try {
    const messages = await emailServices.fetchEmails();
    console.log("Fetching email");
    if (messages.length > 0) {
      await emailServices.emailHandler(messages);
    }
  } catch (error) {
    logger.error(`Error in scheduled task: ${error.message}`);
  }
});

// Add Diary Entry
const diarypost = async (req, res, next) => {
  const { content } = req.body;
  try {
    const diary = await diaryServices.createDiaryWeb({
      userId: req.userId,
      content,
    });
    logger.info(`A log has been succesfully saved by ${req.userId}`);
    return res.status(201).json({
      status: "success",
      message: "Diary succesfully saved",
      data: diary,
    });
  } catch (err) {
    logger.error("Diary/Post:", err);
    next(err);
  }
};

// Get All Diary Entries
const diaryget = async (req, res, next) => {
  const { limit, page } = req.body;
  const paginationLimit = limit || 12;
  const paginationPage = page || 1;
  try {
    const diaries = await diaryServices.findUserDiaries(
      { userId: req.userId },
      paginationLimit,
      paginationPage
    );
    return res.status(200).json({
      status: "success",
      message: "Diaries succesfully retrieved",
      data: diaries,
    });
  } catch (err) {
    logger.error("Diary/Get:", err);
    next(err);
  }
};

// Filter Diary Entries by Date Range
const filter = async (req, res, next) => {
  const { startDate, endDate, limit, page } = req.body;
  const paginationLimit = limit || 12;
  const paginationPage = page || 1;
  try {
    const diaries = await diaryServices.findUserDiaries({
      userId: req.userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });
    return res.status(200).json({
      status: "success",
      message: "Diaries succesfully retrieved",
      data: diaries,
    });
  } catch (err) {
    logger.error("Diary/filter:", err);
    next(err);
  }
};

//Get a single diary with its id
const getid = async (req, res, next) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  const diary_id = req.params.id;
  try {
    const diary = await diaryServices.finddiaryByOne(_id, diary_id);
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
    logger.error("Diary/GetId :", err);
    next(err);
  }
};

//edit a diary
const postUpdate = async (req, res, next) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  const diary_id = req.params.id;
  const { content } = req.body;
  try {
    const diary = await diaryServices.finddiaryByOne(_id, diary_id);
    diary.content = content;
    await diary.save();
    logger.info("Saved edited diary ${diary_id} by user {req.userId}");
    return res.status(200).json({
      status: "success",
      message: "Diaries succesfully edited",
      data: diary,
    });
  } catch (err) {
    logger.error("Diary/PostId :", err);
    next(err);
  }
};

//Delete a diary
const deleteDiary = async (req, res, next) => {
  //I need a JOI schema to verify what's coming in the req.params.id
  try {
    await diaryServices.deleteOneDiary(req.params.id);
    return res.status(200).json({
      status: "success",
      message: "Diaries deleted edited",
    });
  } catch (err) {
    logger.error("Diary/DeleteId :", err);
    next(err);
  }
};

//Delete all diaries
const deleteAllDiary = async (req, res, next) => {
  try {
    logger.info(`All diaries  deleted by user ${req.userId}`);
    await Diary.deleteMany({});
    return res.status(200).json({
      status: "success",
      message: "All diary entries deleted",
    });
  } catch (error) {
    logger.error("Diary/DeleteAllId :", err);
    next(err);
  }
};

module.exports = {
  diarypost,
  diaryget,
  filter,
  getid,
  postUpdate,
  deleteDiary,
  deleteAllDiary,
};
