const mongoose = require("mongoose");

const DiarySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

DiarySchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.userId;
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Diary", DiarySchema);
