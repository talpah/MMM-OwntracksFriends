/* Magic Mirror
 * Node Helper: OwntracksFriends
 *
 * By Cosmin
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var mqtt = require('mqtt');
var moment = require('moment');

module.exports = NodeHelper.create({

    // Override socketNotificationReceived method.

    /* socketNotificationReceived(notification, payload)
     * This method is called when a socket notification arrives.
     *
     * argument notification string - The identifier of the noitication.
     * argument payload mixed - The payload of the notification.
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === "OwntracksFriends-SETUP-MQTT") {
            console.log("OwntracksFriend - initializing mosquitto connection");
            this.doMqtt(payload.mqtt);
            this.config = payload;
        }
    },

    doMqtt: function (settings) {
        var self = this;

        var client = mqtt.connect(settings.host, {
            username: settings.username,
            password: settings.password
        });

        client.on("connect", function () {
            console.log("OwntracksFriends connected to mqtt");
            client.subscribe("owntracks/#");
            // client.publish('presence', 'Hello mqtt')
        });
        client.on("error", function (error) {
            console.log("Owntracks could not connect to mqtt:");
            console.log(error);
        });

        client.on("message", function (topic, message) {
            // message is Buffer
            self.sendUpdate(topic, message)
            // client.end()
        });
    },

    sendUpdate: function (topic, message) {
        var parsedMessage = message.toString();
        if (parsedMessage.length) {
            var otMessage = JSON.parse(parsedMessage);
            this.sendSocketNotification("OwntracksFriends-LOCATION-UPDATE", this.updateUserLocation(topic, otMessage));
        } else {
            this.sendSocketNotification("OwntracksFriends-GENERAL-UPDATE", {topic: topic});
        }

    },

    updateUserLocation: function (topic, message) {
        var user = topic.split("/")[1];
        var device = topic.split("/")[2];
        var gravatar_photo = null;

        if (this.config.known_friends.hasOwnProperty(user)) {
            var crypto = require('crypto');
            var email_hash = crypto.createHash('md5').update(this.config.known_friends[user]).digest('hex');
            gravatar_photo = "//www.gravatar.com/avatar/" + email_hash;
        }

        return {
            user: user,
            user_photo: gravatar_photo,
            device: device,
            data: message
        };
    }
});
