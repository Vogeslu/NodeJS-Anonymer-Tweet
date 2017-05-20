/**
 * Created by Luca on 30.01.2017.
 */

var twitterService          = require("./twitterService"),
    messagesReceivedSuccess = {
        "textMessage": "Deine Textnachricht wird versandt.",
        "pictureCapture": "Dein Bild wird versandt."
    },
    messagesReceivedFailure = {
        "textMessage": "Deine Textnachricht konnte nicht versandt werden.",
        "pictureCapture": "Dein Bild konnte nicht versandt werden."
    },
    messagesSentSuccess = {
        "textMessage": "Ich habe deine Nachricht gesendet. Link: %link%",
        "pictureCapture": "Ich habe dein Bild gesendet. Link: %link%"
    },
    messagesSentFailure = {
        "textMessage": "Deine Textnachricht konnte nicht versandt werden. Grund: %reason%",
        "pictureCapture": "Dein Bild konnte nicht versandt werden. Grund: %reason%"
    };

function _responseUser(userId, receiveType, result) {
    _sendMessage(userId, result.result=="success"?messagesReceivedSuccess[receiveType.name]:messagesReceivedFailure[receiveType.name]);
}

function _tweetSent(userId, receiveType, result) {
    _sendMessage(userId, result.result=="success"?messagesSentSuccess[receiveType.name].replace("%link%",result.link):messagesSentFailure[receiveType.name].replace("%reason%",result.reason));
}

function _sendMessage(userId, message) {
    twitterService.sendDirectMessage(userId,message);
}

module.exports = {
    responseUser : function(chatId, receiveType, result) { _responseUser(chatId, receiveType, result); },
    tweetSent    : function(chatId, receiveType, result) { _tweetSent(chatId, receiveType, result); },
    sendMessage  : function(chatId, message)             { _sendMessage(chatId, message); }
}