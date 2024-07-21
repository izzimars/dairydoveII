const Diary = require("../models/diarymodel");
const logger = require("../utils/logger");

const finddiaryByOne = async (field, value) => {
  try {
    const query = {};
    query[field] = value;
    const diary = await Diary.findOne(query);
    return diary;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const findUserDiaries = async (value, paginationLimit, paginationPage) => {
  try {
    const diaries = await Diary.find(value)
      .sort({ date: -1 })
      .limit(paginationLimit)
      .skip((paginationPage - 1) * paginationLimit);
    return diaries;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const createDiary = async (diaryData) => {
  try {
    const diary = await new Diary(diaryData);
    await diary.save();
    logger.info(`Diary ${diary._id} successfully created`);
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const createDiaryWeb = async (diaryData) => {
  try {
    const diary = await new Diary(diaryData);
    await diary.save();
    logger.info(`Diary ${diary._id} successfully created`);
    return diary;
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

const deleteOneDiary = async (diaryData) => {
  try {
    const diary = await Diary.deleteOne({ _id: diaryData });
    console.log(diary);
    logger.info(`Diary ${diary._id} successfully deleted`);
  } catch (err) {
    logger.info(err.message);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};
// const updatediaryByOne = async (diaryId) => {
//   try {
//     const diary = await diary.updateOne({ _id: diaryId }, { verified: true });
//     logger.info(`diary profile successfully updated ${diaryId}`);
//   } catch (err) {
//     logger.info(err.message);
//     const error = new Error("Internal Server Error");
//     error.status = 500;
//     throw error;
//   }
// };

module.exports = {
  finddiaryByOne,
  createDiary,
  createDiaryWeb,
  findUserDiaries,
  deleteOneDiary,
  //updatediaryByOne,
};
