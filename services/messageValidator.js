/**
 * Created by Luca on 31.01.2017.
 */

var blockedWords = require("../utils/blockedWords");
    config       = require("../utils/config");
    _delayedUsers = {};

function isSpam(message) {
    var formattedMessage = message.replace(" ","").replace("\n","");
    var lastCharacter = "";
    var repeat = 0;
    for(var i = 0; i < formattedMessage.length; i++) {
        if(lastCharacter==formattedMessage.charAt(i)) {
            repeat++;
            if(repeat >= 5) {
                return true;
            }
        } else {
            repeat = 0;
        }
        lastCharacter = formattedMessage.charAt(i);
    }
    return false;
}

function hasBlockedWords(message) {
    for(var i = 0; i < blockedWords.list.length; i++)
        if(message.toLowerCase().indexOf(blockedWords.list[i].toLowerCase()) != -1)
            return true;
    return false;
}

function canSendMessage(userId) {
    var timeFree = parseInt(Date.now(),10);
    var currentTime = parseInt(Date.now(),10);
    if(typeof _delayedUsers[userId] != 'undefined')
        timeFree = _delayedUsers[userId]+(config.delay*1000);
    return currentTime>=timeFree;
}

function hasDirectMessageArguments(message) {
    return  message.toLowerCase().split(" ")[0].indexOf("/dm") != -1 || message.toLowerCase().split(" ")[0].indexOf("dm") != -1 || message.toLowerCase().split(" ")[0].indexOf("d ") != -1;
}

module.exports = {
    validateMessage : function(userId, message, next) {
        if(!canSendMessage(userId)) return next({"result":"error","reason":"Du kannst nur alle "+config.delay+" Sekunden eine Nachricht senden."});
        if(hasDirectMessageArguments(message)) return next({"result":"error","reason":"Du darfst keine private Nachricht versenden."});
        if(hasBlockedWords(message)) return next({"result":"error","reason":"Deine Nachricht enthält blockierte Begriffe."});
        if(config['spam-filter'] && isSpam(message)) return next({"result":"error","reason":"Du darfst keine Spamnachrichten versenden."});
        return next({"result":"success"});
    },
    validatePicture : function(userId, next) {
        if(!canSendMessage(userId)) return next({"result":"error","reason":"Du kannst nur alle "+config.delay+" Sekunden eine Nachricht senden."});
        return next({"result":"success"});
    },
    delayedUsers : _delayedUsers
}
