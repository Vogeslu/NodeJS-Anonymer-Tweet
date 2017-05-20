/**
 * Created by Luca on 30.01.2017.
 */

var config          = require("./utils/config");

console.log("[Sys][Info] Starting \"Anonymer Tweet\" - Service");
console.log("[Sys][Info] Maintenance: "+(config.maintenance?"enabled":"disabled"));
console.log("[Sys][Info] Message Repeat Delay: "+config.delay);
console.log("[Sys][Info] Message Spam Filter: "+(config['spam-filter']?"enabled":"disabled"));

var telegramService = require("./services/telegramService");
var twitterReceiver = require("./services/twitterReceiver");