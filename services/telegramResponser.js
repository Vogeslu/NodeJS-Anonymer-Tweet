/**
 * Created by Luca on 30.01.2017.
 */

var telegramService = require("./telegramService"),
    messagesReceivedSuccess = {
        "undefined": "Ich kann nur Textnachrichten, Sticker und Bilder (mit Nachricht) versenden.",
        "textMessage": "Deine Textnachricht wird versandt.",
        "picture": "Dein Bild wird versandt.",
        "pictureCapture": "Dein Bild mit Text wird versandt.",
        "sticker": "Dein Sticker wird versandt.",
        "stickerText": "Dein Sticker mit Text wird versandt."
    },
    messagesReceivedFailure = {
        "undefined": "Ich kann nur Textnachrichten, Sticker und Bilder (mit Nachricht) versenden.",
        "textMessage": "Deine Textnachricht konnte nicht versandt werden.",
        "picture": "Dein Bild konnte nicht versandt werden.",
        "pictureCapture": "Dein Bild mit Text konnte nicht versandt werden.",
        "sticker": "Dein Sticker konnte nicht versandt werden.",
        "stickerText": "Dein Sticker mit Text konnte nicht versandt werden."
    },
    messagesSentSuccess = {
        "undefined": "Ich hae nichts gesendet.",
        "textMessage": "Ich habe deine Nachricht gesendet. Link: %link%",
        "picture": "Ich habe dein Bild gesendet. Link: %link%",
        "pictureCapture": "Ich habe dein Bild mit Text gesendet. Link: %link%",
        "sticker": "Ich habe deinen Sticker gesendet. Link: %link%",
        "stickerText": "Ich habe deinen Sticker mit Text gesendet. Link: %link%"
    },
    messagesSentFailure = {
        "undefined": "Ich kann nur Textnachrichten, Sticker und Bilder (mit Nachricht) versenden.",
        "textMessage": "Deine Textnachricht konnte nicht versandt werden. Grund: %reason%",
        "picture": "Dein Bild konnte nicht versandt werden. Grund: %reason%",
        "pictureCapture": "Dein Bild mit Text konnte nicht versandt werden. Grund: %reason%",
        "sticker": "Dein Sticker konnte nicht versandt werden. Grund: %reason%",
        "stickerText": "Dein Sticker mit Text konnte nicht versandt werden. Link: %link%"
    };

function _responseUser(chatId, receiveType, result) {
    _sendMessage(chatId, result.result=="success"?messagesReceivedSuccess[receiveType.name]:messagesReceivedFailure[receiveType.name]);
}

function _tweetSent(chatId, receiveType, result) {
    _sendMessage(chatId, result.result=="success"?messagesSentSuccess[receiveType.name].replace("%link%",result.link):messagesSentFailure[receiveType.name].replace("%reason%",result.reason));
}

function _sendMessage(chatId, message) {
    telegramService.telegramBot.sendMessage(chatId,message);
}

module.exports = {
    responseUser : function(chatId, receiveType, result) { _responseUser(chatId, receiveType, result); },
    tweetSent    : function(chatId, receiveType, result) { _tweetSent(chatId, receiveType, result); },
    sendMessage  : function(chatId, message)             { _sendMessage(chatId, message); }
}