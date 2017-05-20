/**
 * Created by Luca on 31.01.2017.
 */

var config                = require("../utils/config"),
    twitterService        = require("./twitterService"),
    commandParser         = require("./commandParser"),
    https                 = require("https"),
    fs                    = require("fs"),
    utils                 = require("../utils/utils"),
    twitterResponser      = require("./twitterResponser"),
    Twit                  = require('twit'),
    messageValidator      = require("./messageValidator"),
    twitterReceiverClient = new Twit({
                                consumer_key:         config['twitter-dm-receiver']['consumer_key'],
                                consumer_secret:      config['twitter-dm-receiver']['consumer_key_secret'],
                                access_token:         config['twitter-dm-receiver']['access_token'],
                                access_token_secret:  config['twitter-dm-receiver']['access_token_secret'],
                                timeout_ms:           60*1000,
                             }),
    twitterReceiveStream  = twitterReceiverClient.stream('user',{ stingify_friend_ids: true }),
    receiveTypes          = {
                                COMMAND:         {"name": "command"},
                                TEXT:            {"name": "textMessage"},
                                PICTURE_CAPTURE: {"name": "pictureCapture"}
                            };

twitterReceiveStream.on('direct_message', function (directMsg) {
    var textMessage = directMsg.direct_message.text,
        senderId    = directMsg.direct_message.sender_id_str,
        senderName  = directMsg.direct_message.sender_screen_name,
        receiveType = receiveTypes.TEXT;

    if(senderId == "825255838797459456")
        return;

    if(config.maintenance && senderId != "3292060903") {
        twitterResponser.sendMessage(senderId,"Es finden gerade Wartungsarbeiten statt.");
        return;
    }

    if(hasPictures(directMsg)) receiveType = receiveTypes.PICTURE_CAPTURE;
    if(isCommand(directMsg)) receiveType = receiveTypes.COMMAND;

    console.log("[Twi][Rece] "+(receiveType.name)+" by "+senderName);

    if(receiveType == receiveTypes.TEXT) {
        messageValidator.validateMessage(senderId+"-"+senderName,textMessage,function(validatorResult) {
            if(validatorResult.result == "success") {
                messageValidator.delayedUsers[senderId+"-"+senderName]=parseInt(Date.now());
                twitterService.sendTweet({status: textMessage}, function (tweetResult) {
                    twitterResponser.tweetSent(senderId, receiveType, tweetResult);
                });
            } else {
                twitterResponser.tweetSent(senderId, receiveType, validatorResult);
            }
        });
    }

    if(receiveType == receiveTypes.COMMAND) {
        var commandRaw = textMessage;
        var args = [];
        var command = commandRaw.replace("/","").split(" ")[0].toLowerCase();
        for(var i = 1; i < commandRaw.split(" ").length; i++) args.push(commandRaw.split(" ")[i]);
        console.log("[Twi][Comm] Received command "+command+" with arguments "+JSON.stringify(args));
        commandParser.parseCommand(1,senderId,command,args);
    }

    if(receiveType == receiveTypes.PICTURE_CAPTURE)
        twitterResponser.sendMessage(senderId, "Es werden nur Texte und Befehle unterstützt.");
}).on('error', function(error) {
    console.log(error);
});

function downloadPicture(mediaURL, fileName, next) {
    if(mediaURL == null || mediaURL.length==0)
        return next({"result":"error","code":"1"});
    console.log("[Twi][Down] Downloading Picture \""+fileName+"\"");
    var fileTarget = "./files/twitter/"+fileName;
    var tempFile = fs.createWriteStream(fileTarget);
    https.get(mediaURL, function(response) {
        response.pipe(tempFile);
        tempFile.on('finish', function() {
            console.log("[Twi][Down] Finished downloading Picture \""+mediaURL+"\"");
            return next({"result":"success","filePath":fileTarget});
        });
    }).on('error', function(err) {
        console.log("[Twi][Down] Failed downloading Picture \""+mediaURL+"\" ("+err+")");
        fs.unlink(fileTarget);
        return next({"result":"error","code":"2"});
    });
}

function isCommand(directMsg) { return typeof directMsg.direct_message.text != 'undefined' && directMsg.direct_message.text.startsWith("/");}
function hasPictures(directMsg) { return typeof directMsg.direct_message.entities.media != 'undefined' }
function getPictureIDs(directMsg) { var mediaIDList = []; if(!hasPictures(directMsg)) return mediaIDList; for(var i = 0; i < directMsg.direct_message.entities.media.length; i++) mediaIDList.push(directMsg.direct_message.entities.media[i].id_str); return mediaIDList; }
function getPictureURLs(directMsg) { var mediaUrlList = []; if(!hasPictures(directMsg)) return mediaUrlList; for(var i = 0; i < directMsg.direct_message.entities.media.length; i++) mediaUrlList.push(directMsg.direct_message.entities.media[i].url); return mediaUrlList; }
function getPictureMediaURLs(directMsg) { var mediaUrlList = []; if(!hasPictures(directMsg)) return mediaUrlList; for(var i = 0; i < directMsg.direct_message.entities.media.length; i++) mediaUrlList.push(directMsg.direct_message.entities.media[i].media_url); return mediaUrlList; }