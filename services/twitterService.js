/**
 * Created by Luca on 31.01.2017.
 */

var config              = require("../utils/config"),
    fs                  = require('fs'),
    Twitter             = require('twitter'),
    twitterErrorReasons = require('./twitterErrorReasons'),
    messageValidator    = require("./messageValidator"),
    twitterClient       = new Twitter({
                              consumer_key: config['twitter-responser']['consumer_key'],
                              consumer_secret: config['twitter-responser']['consumer_key_secret'],
                              access_token_key: config['twitter-responser']['access_token'],
                              access_token_secret: config['twitter-responser']['access_token_secret'],
                          });

function _uploadMedia(filePath, next) {
    var file = fs.readFileSync(filePath);
    twitterClient.post("media/upload", {media: file}, function(error, media, response) {
        if(error) { return next({"result":"error","code":"4"}); }
        console.log("[Twi][Twee] Media uploaded");
        return next({"result":"success","media_id_string":JSON.parse(response.body).media_id_string});
    });
}

function _sendTweet(status, next) {
    twitterClient.post("statuses/update", status, function(error, tweet, response) {
        if(error) {

            var code = JSON.parse(response.body).errors[0].code;
            var error = typeof twitterErrorReasons[code] != 'undefined'?twitterErrorReasons[code]:"Ein unbekannter Fehler ist aufgetreten";
            return next({"result":"error","code":"5", "reason":error});
        }
        console.log("[Twi][Twee] Tweet sent");
        return next({"result":"success","link":JSON.parse(response.body).text.indexOf("https")!=-1?JSON.parse(response.body).text:"https://twitter.com/Anotweet1/status/"+JSON.parse(response.body).id_str});
    });
}

function _sendDirectMessage(userid, message) {
    twitterClient.post('direct_messages/new', {user_id: userid, text: message},  function(error, tweet, response) {});
}

module.exports = {
    uploadMedia       : function(filePath, next) { _uploadMedia(filePath,next); },
    sendTweet         : function(status, next)   { _sendTweet(status,next); },
    sendDirectMessage : function(userid, message)   { _sendDirectMessage(userid,message); }
}