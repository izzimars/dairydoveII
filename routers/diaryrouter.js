const express = require("express");
const validate = require("../utils/validate");
const schema = require("../schema/validationschema");
const diaryController = require("../controllers/diarycontroller");
const diaryrouter = express.Router();
const middleware = require("../utils/middleware");

diaryrouter.post(
  "/",
  validate(schema.postSchema),
  middleware.verifyToken,
  diaryController.diarypost
);

diaryrouter.get(
  "/",
  validate(schema.getDiarySchema),
  middleware.verifyToken,
  diaryController.diaryget
);

diaryrouter.get(
  "/filter",
  validate(schema.dateSchema),
  middleware.verifyToken,
  diaryController.filter
);

diaryrouter.get("/:id",
  validate(schema.mongodbSchema, "params"),
  middleware.verifyToken, 
  diaryController.getid
);

diaryrouter.patch("/:id", 
  validate(schema.mongodbSchema, "params"),
  middleware.verifyToken, 
  diaryController.postUpdate
);

diaryrouter.delete(
  "/delete/:id",
  middleware.verifyToken,
  validate(schema.mongodbSchema, "params"),
  diaryController.deleteDiary
);

diaryrouter.delete(
  "/deleteall",
  middleware.verifyToken,
  diaryController.deleteAllDiary
);

module.exports = diaryrouter;
