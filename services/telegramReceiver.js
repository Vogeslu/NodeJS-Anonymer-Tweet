/**
 * Created by Luca on 30.01.2017.
 */

var telegramService       = require("./telegramService"),
    telegramResponser     = require("./telegramResponser"),
    commandParser         = require("./commandParser"),
    messageValidator      = require("./messageValidator"),
    https                 = require('https'),
    fs                    = require('fs'),
    webp                  = require('webp-converter'),
    utils                 = require('../utils/utils'),
    config                = require("../utils/config"),
    receiveTypes          = {
        UNDEFINED: {"name": "undefined"},
        TEXT: {"name": "textMessage", "active": true, "needWebResponse": false},
        COMMAND: {"name": "command", "active":true, "needWebResponse": false},
        PICTURE: {
            "name": "picture",
	        "active": true,
            "needWebResponse": true,
            "firstRequest": "https://api.telegram.org/bot%token%/getFile?file_id=%file_id%",
            "secondRequest": "https://api.telegram.org/file/bot%token%/%file_path%"
        },
        PICTURE_CAPTURE: {
            "name": "pictureCapture",
	        "active": true,
            "needWebResponse": true,
            "firstRequest": "https://api.telegram.org/bot%token%/getFile?file_id=%file_id%",
            "secondRequest": "https://api.telegram.org/file/bot%token%/%file_path%"
        },
        STICKER: {
            "name": "sticker",
	        "active": true
        },
        STICKER_TEXT: {
            "name": "stickerText",
	        "active": true,
            "needWebResponse": true,
            "firstRequest": "https://api.telegram.org/bot%token%/getFile?file_id=%file_id%",
            "secondRequest": "https://api.telegram.org/file/bot%token%/%file_path%"
        }
    },
    stickerSlot           = {},
    stickerMessageQuery   = {};


telegramService.telegramBot.on('message', function (msg) {
    var chatId = msg.from.id;
    var username = msg.from.username;
    var receiveType = receiveTypes.UNDEFINED;

    if(config.maintenance && chatId != 171416824) {
        telegramResponser.sendMessage(chatId,"Es finden gerade Wartungsarbeiten statt.");
        return;
    }

    if(isText(msg))               receiveType = receiveTypes.TEXT;
    if(isCommand(msg))            receiveType = receiveTypes.COMMAND;
    if(isPicture(msg))            receiveType = receiveTypes.PICTURE;
    if(isPictureWithCaption(msg)) receiveType = receiveTypes.PICTURE_CAPTURE;
    if(isSticker(msg))            receiveType = receiveTypes.STICKER;

    console.log("[Tel][Rece] "+(receiveType.name)+" by "+username);

    if(receiveType == receiveTypes.COMMAND) {
        var commandRaw = getMessage(msg);
        var args = [];
        var command = commandRaw.replace("/","").split(" ")[0].toLowerCase();
        for(var i = 1; i < commandRaw.split(" ").length; i++) args.push(commandRaw.split(" ")[i]);
        console.log("[Tel][Comm] Received command "+command+" with arguments "+JSON.stringify(args));
        commandParser.parseCommand(0,chatId,command,args);
    }

    if(receiveType == receiveTypes.TEXT) {

        var textMessage = getMessage(msg);

        if(!(typeof stickerMessageQuery[chatId] == "undefined" || stickerMessageQuery[chatId] == null)) {
            return sendSticker(textMessage,chatId,receiveTypes.STICKER_TEXT);
        } else {
            if (!(typeof stickerSlot[chatId] == "undefined" || stickerSlot[chatId] == null))
                telegramResponser.sendMessage(chatId, "Dein letzter Sticker wurde verworfen.");
            stickerSlot[chatId]=null;
            stickerMessageQuery[chatId]=null;
        }
        
	if(!receiveType.active) return telegramResponser.sendMessage(chatId, "Diese Funktion wurde temporär deaktiviert.");

        messageValidator.validateMessage(chatId,textMessage,function(validatorResult) {
            if(validatorResult.result == "success") {
                messageValidator.delayedUsers[chatId]=parseInt(Date.now());
                telegramResponser.responseUser(chatId, receiveType, {"result": "success", "message": textMessage});
                telegramService.twitterService.sendTweet({status: textMessage}, function (tweetResult) {
                    telegramResponser.tweetSent(chatId, receiveType, tweetResult);
                });
            } else
                telegramResponser.tweetSent(chatId, receiveType, validatorResult);
        });
    }

    if(receiveType == receiveTypes.PICTURE) {

        if(!(typeof stickerSlot[chatId] == "undefined" || stickerSlot[chatId] == null))
            telegramResponser.sendMessage(chatId,"Dein letzter Sticker wurde verworfen.");
        stickerSlot[chatId]=null;
        stickerMessageQuery[chatId]=null;

	if(!receiveType.active) return telegramResponser.sendMessage(chatId, "Diese Funktion wurde temporär deaktiviert.");

        messageValidator.validatePicture(chatId,function(validatorResult) {
            if (validatorResult.result == "success") {
                messageValidator.delayedUsers[chatId]=parseInt(Date.now());
                handlePicturePathFetcher(msg, function (filePath) {
                    downloadPicture(filePath, function (result) {
                        telegramResponser.responseUser(chatId, receiveType, result);
                        if (result.result == "success")
                            telegramService.twitterService.uploadMedia(result.filePath, function (mediaResult) {
                                fs.unlink(result.filePath);
                                if (mediaResult.result == "success")
                                    telegramService.twitterService.sendTweet({media_ids: mediaResult.media_id_string}, function (tweetResult) {
                                        telegramResponser.tweetSent(chatId, receiveType, tweetResult);
                                    });
                                else
                                    telegramResponser.tweetSent(chatId, receiveType, {
                                        "result": "error",
                                        "reason": "Fehler beim Upload"
                                    });
                            });
                        else
                            telegramResponser.tweetSent(chatId, receiveType, {
                                "result": "error",
                                "reason": "Bildfehler"
                            });
                    })
                });
            } else
                telegramResponser.tweetSent(chatId, receiveType, validatorResult);
        });
    }

    if(receiveType == receiveTypes.PICTURE_CAPTURE) {

        if(!(typeof stickerSlot[chatId] == "undefined" || stickerSlot[chatId] == null))
            telegramResponser.sendMessage(chatId,"Dein letzter Sticker wurde verworfen.");
        stickerSlot[chatId]=null;
        stickerMessageQuery[chatId]=null;

	if(!receiveType.active) return telegramResponser.sendMessage(chatId, "Diese Funktion wurde temporär deaktiviert.");

        var caption = msg.caption;

        messageValidator.validateMessage(chatId,caption,function(validatorResult) {
            if(validatorResult.result == "success") {
                messageValidator.delayedUsers[chatId]=parseInt(Date.now());
                handlePicturePathFetcher(msg, function (filePath) {
                    downloadPicture(filePath, function (result) {

                        telegramResponser.responseUser(chatId, receiveType, result);

                        if (result.result == "success")
                            telegramService.twitterService.uploadMedia(result.filePath, function (mediaResult) {
                                fs.unlink(result.filePath);
                                if (mediaResult.result == "success")
                                    telegramService.twitterService.sendTweet({
                                        status: caption,
                                        media_ids: mediaResult.media_id_string
                                    }, function (tweetResult) {
                                        telegramResponser.tweetSent(chatId, receiveType, tweetResult);
                                    });
                                else
                                    telegramResponser.tweetSent(chatId, receiveType, {
                                        "result": "error",
                                        "reason": "Fehler beim Upload"
                                    });
                            });
                        else
                            telegramResponser.tweetSent(chatId, receiveType, {
                                "result": "error",
                                "reason": "Bildfehler"
                            });
                    })
                });
            } else
                telegramResponser.tweetSent(chatId, receiveType, validatorResult);
        });

    }

    if(receiveType == receiveTypes.STICKER) {

        if(!(typeof stickerSlot[chatId] == "undefined" || stickerSlot[chatId] == null))
            telegramResponser.sendMessage(chatId,"Dein letzter Sticker wurde verworfen.");
        stickerSlot[chatId]=null;
        stickerMessageQuery[chatId]=null;
	
	if(!receiveType.active) return telegramResponser.sendMessage(chatId, "Diese Funktion wurde temporär deaktiviert.");

        messageValidator.validatePicture(chatId,function(validatorResult) {
            if (validatorResult.result == "success") {
                handleStickerPathFetcher(msg, function (filePath) {
                    downloadSticker(filePath, function (result) {
                        if (result.result != "success")
                            telegramResponser.responseUser(chatId, receiveType, result);
                        else
                            convertSticker(result.filePath, function (result) {
                                if (result.result != "success")
                                    telegramResponser.responseUser(chatId, receiveType, result);
                                else {
                                    telegramResponser.sendMessage(chatId,"Du kannst noch mit /stickermessage <Nachricht> eine Textnachricht zum Sticker hinzufügen. Um keine Nachricht anzuhängen, so gib /sendsticker ein.");
                                    stickerSlot[chatId]=result.filePath;
                                }
                            });
                    })
                });
            } else
                telegramResponser.tweetSent(chatId, receiveType, validatorResult);
        });
    }
});

function isText(msg) { return typeof msg.text != 'undefined'; }
function isCommand(msg) { return typeof msg.text != 'undefined' && msg.text.startsWith("/");}
function isPicture(msg) { return typeof msg.photo != 'undefined'; }
function isPictureWithCaption(msg) { return typeof msg.photo != 'undefined' && typeof msg.caption != 'undefined'; }
function isSticker(msg) { return typeof msg.sticker != 'undefined' }
function isStickerResponse(chatId) { return typeof stickerSlot[chatId] != 'undefined' && stickerSlot[chatId]!=null }

function isStickerWithFilePath(msg) { return isSticker(msg) && typeof msg.sticker.file_path != 'undefined'}
function isPictureWithFilePath(msg) { return isPicture(msg) && typeof msg.photo[msg.photo.length-1].file_path != 'undefined' }

function getMessage(msg) { return isText(msg)?msg.text:"" }
function getStickerFileID(msg) { return isSticker(msg)?msg.sticker.file_id:"" }
function getPictureFileID(msg) { if(!(isPicture(msg))) return ""; var fileId = ""; for(var i = 0; i < msg.photo.length; i++) fileId = msg.photo[i].file_id; return fileId; }

function getStickerFilePath(msg) { return isSticker(msg) && isStickerWithFilePath(msg)?msg.sticker.file_path:"" }
function getPictureFilePath(msg) { if(!(isPicture(msg) && isPictureWithFilePath(msg))) return ""; var filePath = ""; for(var i = 0; i < msg.photo.length; i++) filePath = msg.photo[i].file_path; return filePath; }

function handlePicturePathFetcher(msg, next) {
    console.log("[Tel][Fetc] Picture file_path is "+(isPictureWithFilePath(msg)?"already set":"downloading"));
    if (isStickerWithFilePath(msg)) return next(getPictureFileID(msg));
    https.get(receiveTypes.PICTURE.firstRequest.replace("%token%", config.telegram['api-key']).replace("%file_id%", getPictureFileID(msg)), function (response) {
        response.setEncoding('utf8');
        var result = "";
        response.on('data', (chunk) => result += chunk);
        response.on('end', () => {
            next(JSON.parse(result).ok?JSON.parse(result).result["file_path"]:null);
        });
    });
}

function sendSticker(textMessage, chatId, receiveType) {
        if(typeof stickerSlot[chatId] == "undefined" || stickerSlot[chatId] == null)
            return telegramResponser.sendMessage(chatId,"Du musst erst einen Sticker senden.");

        if(textMessage.length == 0) {
            stickerMessageQuery[chatId]=stickerSlot[chatId];
            stickerSlot[chatId]=stickerSlot[chatId];
            return telegramResponser.sendMessage(chatId,"Sende nun deine Nachricht in den Chat");
        }

        var filePath = stickerSlot[chatId];
        telegramResponser.responseUser(chatId, receiveType, {"result": "success"});
        telegramService.twitterService.uploadMedia(filePath, function (mediaResult) {
            fs.unlink(filePath);
            if (mediaResult.result == "success")
                telegramService.twitterService.sendTweet({
                    status: textMessage == "-" ? "" : textMessage,
                    media_ids: mediaResult.media_id_string
                }, function (tweetResult) {
                    telegramResponser.tweetSent(chatId, receiveTypes.STICKER_TEXT, tweetResult);
                });
            else
                telegramResponser.tweetSent(chatId, receiveTypes.STICKER_TEXT, {
                    "result": "error",
                    "reason": "Fehler beim Upload"
                });
        });
        stickerSlot[chatId]=null;
        stickerMessageQuery[chatId]=null;
    }

exports.sendSticker = sendSticker;

function downloadPicture(filePath, next) {
    if(filePath == null || filePath.length==0)
        return next({"result":"error","code":"1"});
    console.log("[Tel][Down] Downloading Picture \""+filePath+"\"");
    var fileName = utils.uniqueId()+"_"+Date.now()+".png";
    var fileTarget = "./files/telegram/"+fileName;
    var tempFile = fs.createWriteStream(fileTarget);
    https.get(receiveTypes.PICTURE.secondRequest.replace("%token%", config.telegram['api-key']).replace("%file_path%", filePath), function(response) {
        response.pipe(tempFile);
        tempFile.on('finish', function() {
            console.log("[Tel][Down] Finished downloading Picture \""+filePath+"\"");
            return next({"result":"success","filePath":fileTarget});
        });
    }).on('error', function(err) {
        console.log("[Tel][Down] Failed downloading Picture \""+filePath+"\" ("+err+")");
        fs.unlink(fileTarget);
        return next({"result":"error","code":"2"});
    });
}

function handleStickerPathFetcher(msg, next) {
    console.log("[Tel][Fetc] Sticker file_path is "+(isStickerWithFilePath(msg)?"already set":"downloading"));
    if (isStickerWithFilePath(msg)) return next(getStickerFilePath(msg));
    https.get(receiveTypes.STICKER_TEXT.firstRequest.replace("%token%", config.telegram['api-key']).replace("%file_id%", getStickerFileID(msg)), function (response) {
        response.setEncoding('utf8');
        var result = "";
        response.on('data', (chunk) => result += chunk);
        response.on('end', () => {
            next(JSON.parse(result).ok?JSON.parse(result).result["file_path"]:null);
        });
    });
}

function downloadSticker(filePath, next) {
    if(filePath == null || filePath.length==0)
        return next({"result":"error","code":"1"});
    console.log("[Tel][Down] Downloading Sticker \""+filePath+"\"");
    var fileName = utils.uniqueId()+"_"+Date.now()+".webp";
    var fileTarget = "./files/telegram/"+fileName;
    var tempFile = fs.createWriteStream(fileTarget);
    https.get(receiveTypes.STICKER_TEXT.secondRequest.replace("%token%", config.telegram['api-key']).replace("%file_path%", filePath), function(response) {
        response.pipe(tempFile);
        tempFile.on('finish', function() {
            console.log("[Tel][Down] Finished downloading Sticker \""+filePath+"\"");
            return next({"result":"success","filePath":fileTarget});
        });
    }).on('error', function(err) {
        console.log("[Tel][Down] Failed downloading Sticker \""+filePath+"\" ("+err+")");
        fs.unlink(fileTarget);
        return next({"result":"error","code":"2"});
    });
}

function convertSticker(filePath, next) {
    var fileTarget = filePath.replace("webp","png");
    console.log("[Tel][Conv] Converting Sticker \""+filePath+"\"");
    webp.dwebp(filePath,fileTarget,"-o", function(result) {
        if(result.split("\n")[0] == "100") { fs.unlink(filePath); return next({"result":"success","filePath":fileTarget}) }
        return next({"result":"error","code":"3"});
    });
}

