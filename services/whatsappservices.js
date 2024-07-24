const WhatsAppBot = require('@green-api/whatsapp-bot');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require("../utils/config");
const { number } = require('joi');

const session = WhatsAppBot.session
const Stage = WhatsAppBot.Stage
const Scene = WhatsAppBot.BaseScene

// Handler factoriess
const { enter, leave } = Stage

// Declaration
const idInstance= config.ID_INSTANCE;
const apiurl = config.API_URL;
const apiTokenInstance= config.API_TOKEN_INSTANCE;

// Whatsapp URL
const url =
`${apiurl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;


// Doings scene

const doingsScene = new Scene('doings')
doingsScene.enter((ctx) => ctx.reply('Start logging your dairy entry now\n\nEnd it by sending "end"'))
doingsScene.leave((ctx) =>{ ctx.reply('Thanks for logging with Diary Dove, Bye😊')
 console.log(message)
 bot.stop()
})
doingsScene.hears('end', leave('doings'))
doingsScene.hears('End', leave('doings'))
doingsScene.on('message', (ctx) =>{ 
    let newm = ctx.update.message.text;
    messages = messages+"/n"+newm;
    ctx.replyWithMarkdown('would you like to continue your entry?\n\nIf so keep logging, if not send "end"')
});
const bot = new WhatsAppBot({
    idInstance: idInstance,
    apiTokenInstance: apiTokenInstance
})
const stage = new Stage([doingsScene])
bot.use(session())
bot.use(stage.middleware())

const startBot = () =>{
    let messages = ""
    let numbers
    bot.on('message', (ctx) => ctx.reply('Send "/diary" to start logging'))
    bot.command('dairy', (ctx) => {
        let number = ctx.update.message["chat"].id;
        number = number.split("@")[0];
        numbers = number
        //number.push(numbers)
        logger.info(number);
        ctx.scene.enter("doings");
      });
      bot.launch();
      return({number:numbers, messages:messages})
}

const sendOtpMessage = async (user_number, otp) => {
    try {       
        const id = `${user_number}@c.us`
        const payload = { chatId: id,
            message: `Enter this ${otp} in the app to complete your verification.\n\nOTP expires in 6 minutes.`
         };
        const headers = {"Content-Type": "application/json"};
        const response = await axios.post(url, payload, { headers: headers });
        logger.info(response.data);
    } catch (err) {
      logger.error(err.message);
      throw err;
    }
  };


const sendReminderBot = async (user_number,username) => {
  try {
    const id = `${user_number}@c.us`
    const payload = { chatId: id,
        message: `Hello ${username}😊\n\nIt is time to take a break and be one with your thoughts.\n\n\nDiary Dove is reminding you to log a diary entry now.\nReply this message or sign into the app to load your entry\nIgnore this message if you have logged your entry for this time.`
    };
    const headers = {"Content-Type": "application/json"};
    const response = await axios.post(url, payload, { headers: headers });
    logger.info(response.data);
    const newDiary = await startBot();
    logger.info(newDiary)
  } catch (err) {
    logger.error(err.message);
    
  }
};

sendReminderBot(2349075857450);

module.exports = {
    sendOtpMessage,
    sendReminderBot
}