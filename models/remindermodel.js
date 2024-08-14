const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  hour: { type: Number, required: true },
  time: { type: Number, required: true },
  jobId: { type: String },
});

ReminderSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Reminder", ReminderSchema);
