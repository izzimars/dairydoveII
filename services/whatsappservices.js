const WhatsAppBot = require("@green-api/whatsapp-bot");
const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../utils/config");
const { number } = require("joi");
const userServices = require("./userService");
const diaryServices = require("./diaryServices");
let inactivityTimeout;
const session = WhatsAppBot.session;
const Stage = WhatsAppBot.Stage;
const Scene = WhatsAppBot.BaseScene;

// Handler factoriess
const { enter, leave } = Stage;

// Declaration
const idInstance = config.ID_INSTANCE;
const apiurl = config.API_URL;
const apiTokenInstance = config.API_TOKEN_INSTANCE;

// Whatsapp URL
const sendMessage = async (user_number, message) => {
  try {
    user_number = user_number.replace(/\+/g, "");
    user_number = Number(user_number);
    const url = `${apiurl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    const id = `${user_number}@c.us`;
    const payload = { chatId: id, message: message };
    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(url, payload, { headers: headers });
    logger.info("Message sent successfully");
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

//checkWhatapp
const checkWhatapp = async (user_number) => {
  try {
    user_number = user_number.replace(/\+/g, "");
    user_number = Number(user_number);
    console.log(user_number);
    const url = `${apiurl}/waInstance${idInstance}/checkWhatsapp/${apiTokenInstance}`;
    const payload = { phoneNumber: user_number };
    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(url, payload, { headers: headers });
    logger.info(response.data);
    return response.data;
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

// Doings scene
let diaryContent = "";
const doingsScene = new Scene("doings");

const resetInactivityTimeout = (ctx) => {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    ctx.reply(
      "Session ended due to inactivity. Your diary entry has been saved."
    );
    ctx.scene.leave(); // Leave the scene
  }, 60 * 60 * 1000); // 30 minutes in milliseconds
};

doingsScene.enter((ctx) => {
  ctx.reply(
    'Hello😊,\n\nWe have started logging your dairy entry now\n\n1. Press "1" to clear this entry\n2. Press "2" to end this session'
  );
});

doingsScene.leave((ctx) => {
  let number = ctx.update.message["chat"].id;
  number = number.split("@")[0];
  number = "+" + number;
  logger.info(number);
  diaryContent = diaryContent.trim();
  console.log(diaryContent);
  ctx.reply("Thanks for logging with Diary Dove, Bye😊");
  whatsappHandler(number, diaryContent);
});
// doingsScene.hears(["save", "Save", "1"], (ctx) => {
//   ctx.replyWithMarkdown(
//     'Last entries successfully added please😊, continue with a new mesage. \n3.Press "3" to save this session'
//   );
// });

doingsScene.hears(["clear", "Clear", "1"], (ctx) => {
  let remvLine = diaryContent.split("\n");
  remvLine.pop();
  diaryContent = remvLine.join("\n");
  ctx.replyWithMarkdown(
    'Last line cleared successfully from diary entries \nPlease😊, continue with a new mesage. \n\n2. Press "2" to end and save this session'
  );
});

doingsScene.hears(["end", "End", "2"], leave("doings"));

doingsScene.on("message", (ctx) => {
  let newm = ctx.update.message.text;
  diaryContent = diaryContent + "\n" + newm;
  console.log(diaryContent);
  ctx.replyWithMarkdown(
    'Last entries successfully added \nPlease😊, continue with a new mesage\n\n1. Press "1" to clear last entry\n2. Press "2" to end and save this session'
  );
  resetInactivityTimeout(ctx);
});

//initializing bot
const startBot = () => {
  const bot = new WhatsAppBot({
    idInstance: idInstance,
    apiTokenInstance: apiTokenInstance,
  });
  const stage = new Stage([doingsScene]);
  bot.use(session());
  bot.use(stage.middleware());
  bot.hears("diary", (ctx) => {
    ctx.scene.enter("doings");
  });
  bot.on("message", (ctx) => {
    let newm = ctx.update.message.text;
    diaryContent = diaryContent + "\n" + newm;
    ctx.scene.enter("doings");
  });
  bot.launch();
  logger.info("Starting Whatsapp bot");
};

//Whasapp diary log handler
const whatsappHandler = async (user_number, message) => {
  logger.info("processing a whatsapp message");
  console.log(message);
  if (user_number) {
    try {
      const user = await userServices.findUserByOne("phonenumber", user_number);
      if (!user || !user.verified) {
        await sendNullUser(user_number);
        logger.info(`A log was attempted by ${user_number}`);
        diaryContent = "";
      } else {
        await diaryServices.createDiaryWeb({
          userId: user._id,
          content: message,
        });
        await sendSucMes(user_number);
        logger.info(`A log was saved for ${user_number}`);
        diaryContent = "";
      }
    } catch (error) {
      logger.error(`An error occurred for user ${user_number}: ${error}`);
      try {
        await sendFaiMes(user_number);
        diaryContent = "";
      } catch (err) {
        logger.error("Error occured in Whatsapp/sendMessage", err);
        const error = new Error("Internal Server Error");
        error.status = 500;
        throw error;
      }
    }
  }
};

//send OTP function
const sendOtpMessage = async (user_number, otp) => {
  try {
    message = `Enter this ${otp} in the app to complete your verification.\n\nOTP expires in 6 minutes.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

// Send Reminder function
const sendReminderBot = async (user_number, username) => {
  try {
    message = `Hello ${username}😊\n\nIt is time to take a break and be one with your thoughts.\n\nDiary Dove is reminding you to log a diary entry now.\n\nReply this message or sign into the app to start logging your entry\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
    logger.info("Whatsapp Reminder is sent successfully");
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

// Send SUccessful message function
const sendSucMes = async (user_number) => {
  try {
    message = `Diary has been successfully logged.\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

// send invalid user function
const sendNullUser = async (user_number) => {
  try {
    message = `Failed to save Diary.\n\nEither user is not registered or not verified, Log into diary dove to rectify.\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

//send failure message function
const sendFaiMes = async (user_number) => {
  try {
    message = `Error occured on the server please resend your diary or sign in to diary dove to log your entry.\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("Error occured in Whatsapp/sendMessage", err);
    const error = new Error("Internal Server Error");
    error.status = 500;
    throw error;
  }
};

startBot();


module.exports = {
  whatsappHandler,
  checkWhatapp,
  sendReminderBot,
  sendOtpMessage,
};
