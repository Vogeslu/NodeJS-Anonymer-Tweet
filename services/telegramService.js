/**
 * Created by Luca on 30.01.2017.
 */

var config         = require("../utils/config"),
    twitterService = require('./twitterService'),
    TelegramBot    = require('node-telegram-bot-api'),
    telegramBot    = new TelegramBot(config.telegram['api-key'], { polling: true });

module.exports = {
    telegramBot    : telegramBot,
    twitterService : twitterService
};

var telegramReceiver = require("./telegramReceiver");
