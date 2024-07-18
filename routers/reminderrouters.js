const express = require("express");
const validate = require("../utils/validate");
const schema = require("../schema/validationschema");
const reminderController = require("../controllers/reminderscontroller");
const middleware = require("../utils/middleware");
const remindersroute = express.Router();

remindersroute.get(
  "/",
  middleware.verifyToken,
  reminderController.getReminders
);

remindersroute.post(
  "/addnew",
  middleware.verifyToken,
  validate(schema.timeSchema),
  reminderController.addReminders
);

remindersroute.delete(
  "/delete/:id",
  middleware.verifyToken,
  reminderController.deleteReminders
);

module.exports = remindersroute;
