/**
 * Created by Luca on 31.01.2017.
 */
var telegramResponser = require("./telegramResponser"),
    telegramReceiver  = require("./telegramReceiver"),
    twitterResponser  = require("./twitterResponser"),
    commandResponses  = require("./commandResponses");

module.exports = {
    parseCommand: function(type, chatId, commandName, args) {

        var argumentText = ""; for(var i = 0; i < args.length; i++) argumentText+=args[i]+" ";

        if(commandName=="start") { return type==0?telegramResponser.sendMessage(chatId, commandResponses.startMessage_telegram):twitterResponser.sendMessage(chatId, commandResponses.startMessage_twitter); }
        if(commandName=="help") { return type==0?telegramResponser.sendMessage(chatId, commandResponses.resultHelp_telegram):twitterResponser.sendMessage(chatId, commandResponses.resultHelp_twitter); }
        if(commandName=="commands") { return type==0?telegramResponser.sendMessage(chatId, commandResponses.commands):twitterResponser.sendMessage(chatId, commandResponses.commands); }
        if(commandName=="twitter") { return type==0?telegramResponser.sendMessage(chatId, "https://twitter.com/Anotweet1"):twitterResponser.sendMessage(chatId, "https://twitter.com/Anotweet1"); }
        if(commandName=="stickermessage") return type==0?telegramReceiver.sendSticker(argumentText,chatId, {"name": "stickerText"}):twitterResponser.sendMessage(chatId,"Dieser Befehl ist nur auf Telegram verfügbar. (https://t.me/Anotweet1)");
        if(commandName=="sendsticker") return type==0?telegramReceiver.sendSticker("-",chatId, {"name": "sticker"}):twitterResponser.sendMessage(chatId,"Dieser Befehl ist nur auf Telegram verfügbar. (https://t.me/Anotweet1)");
        return  type==0?telegramResponser.sendMessage(chatId, "Unbekannter Befehl. (/commands)"):twitterResponser.sendMessage(chatId, "Unbekannter Befehl. (/commands)");
    }
}
