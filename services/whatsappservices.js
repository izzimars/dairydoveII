const WhatsAppBot = require("@green-api/whatsapp-bot");
const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../utils/config");
const { number } = require("joi");
const userServices = require("./userService");
const diaryServices = require("./diaryServices")

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
    user_number = user_number.replace(/\+/g,"");
    user_number = Number(user_number);
    const url = `${apiurl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    const id = `${user_number}@c.us`;
    const payload = { chatId: id, message: message };
    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(url, payload, { headers: headers });
    logger.info(response.data);
  } catch (err) {
    logger.error(err.message);
  }
};


//checkWhatapp
const checkWhatapp = async (user_number) => {
    try {
      user_number = user_number.replace(/\+/g,"");
      user_number = Number(user_number);
      console.log(user_number)
      const url = `${apiurl}/waInstance${idInstance}/checkWhatsapp/${apiTokenInstance}`;
      const payload = { phoneNumber: user_number};
      const headers = { "Content-Type": "application/json" };
      const response = await axios.post(url, payload, { headers: headers });
      logger.info(response.data);
      return response.data
    } catch (err) {
      logger.error(err.message);
    }
  };

// Doings scene
let diaryContent = "";
const doingsScene = new Scene("doings");
doingsScene.enter((ctx) =>
  ctx.reply('Start logging your dairy entry now\n\nEnd it by sending "end"')
);
doingsScene.leave((ctx) => {
  ctx.reply("Thanks for logging with Diary Dove, Bye😊");
  let number = ctx.update.message["chat"].id;
  number = number.split("@")[0];
  logger.info(number);
  console.log("message");
  diaryContent = diaryContent.trim();
  console.log(diaryContent);
  whatsappHandler(number, diaryContent);
});
doingsScene.hears(["end", "End"], leave("doings"));
doingsScene.on("message", (ctx) => {
  let newm = ctx.update.message.text;
  diaryContent = diaryContent + "\n" + newm;
  ctx.replyWithMarkdown(
    'would you like to continue your entry?\n\nIf so keep logging, if not send "end"'
  );
});

//initializing bot
const startBot= () => {
const bot = new WhatsAppBot({
  idInstance: idInstance,
  apiTokenInstance: apiTokenInstance,
});
const stage = new Stage([doingsScene]);
bot.use(session());
bot.use(stage.middleware());
bot.command("diary", (ctx) => {
  ctx.scene.enter("doings");
});
bot.on("message", (ctx) => ctx.reply('Send "/diary" to start logging'));
bot.launch();
logger.info("Starting Whatsapp bot")
};


//Whasapp diary log handler
const whatsappHandler = async (user_number, message) => {
  logger.info("processing a whatsapp message");
  if (user_number) {
    try {
      console.log("annoying israel")
      const user = await userServices.findUserByOne("phonenumber", user_number);
      if (!user || !user.verified) {
        await sendNullUser(user_number);
        logger.info(`A log was attempted by ${user_number}`);
        diaryContent = "";
      } else {
        await diaryServices.createDiary({ userId: user._id, content: message });
        await sendSucMes(user_number);
        logger.info(`A log was saved for ${user_number}`);
        diaryContent = "";
      }
    } catch (error) {
      logger.error(
        `An error occurred for user ${user_number}: ${error.message}`
      );
      try {
        await sendFaiMes(user_number);
        diaryContent = "";
      } catch (err) {
        logger.error("An error occurred at whatsapp handler: ", err.message);
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
    logger.error("whatsapp SendOtpMessage:", err.message);
  }
};


// Send Reminder function
const sendReminderBot = async (user_number, username) => {
  try {
    message = `Hello ${username}😊\n\nIt is time to take a break and be one with your thoughts.\n\n\nDiary Dove is reminding you to log a diary entry now.\n\n\nReply this message or sign into the app to load your entry\n\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("whatsapp sendReminderBot:",err.message);
  }
};


// Send SUccessful message function
const sendSucMes = async (user_number) => {
  try {
    message = `Diary has been successfully logged.\n\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
    logger.info(response.data);
  } catch (err) {
    logger.error("whatsapp sendSucMes:",err.message);
  }
};


// send invalid user function
const sendNullUser = async (user_number) => {
  try {
    message = `Failed to save Diary.\n\n\nEither user is not registered or not verified, Log into diary dove to rectify.\n\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("whatsapp sendNullUser:",err.message);
  }
};


//send failure message function
const sendFaiMes = async (user_number) => {
  try {
    message = `Error occured on the server please resend your diary or sign in to diary dove to log your entry.\n\n\nIgnore this message if you have logged your entry for this time.`;
    await sendMessage(user_number, message);
  } catch (err) {
    logger.error("whatsapp sendFaiMes:",err.message);
  }
};


startBot();



module.exports = {
  whatsappHandler,
  checkWhatapp,
  sendReminderBot,
  sendOtpMessage
};
