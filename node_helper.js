/* Magic Mirror
 * Node Helper: OwntracksFriends
 *
 * By Cosmin
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var mqtt = require('mqtt');
var moment = require('moment');
var http = require('https');
var crypto = require('crypto');

module.exports = NodeHelper.create({


    start: function () {
        console.log("Starting module: " + this.name);
        this.mqttconnection = null;
    },

    // Override socketNotificationReceived method.

    /* socketNotificationReceived(notification, payload)
     * This method is called when a socket notification arrives.
     *
     * argument notification string - The identifier of the noitication.
     * argument payload mixed - The payload of the notification.
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === "OwntracksFriends-SETUP-MQTT") {
            this.doMqtt(payload.mqtt);
            this.config = payload;
        }
    },

    doMqtt: function (settings) {
        var self = this;

        if (this.mqttconnection !== null) {
            console.log(self.name + ' - Reusing mqtt client');
            this.mqttconnection.unsubscribe('owntracks/#');
            this.mqttconnection.subscribe('owntracks/#');
            return;
        }
        this.mqttconnection = mqtt.connect(settings.host, {
            username: settings.username,
            password: settings.password
        });

        this.mqttconnection.on("connect", function () {
            console.log(self.name + " connected to mqtt");
            self.mqttconnection.subscribe("owntracks/#");
            // client.publish('presence', 'Hello mqtt')
        });
        this.mqttconnection.on("error", function (error) {
            console.log(self.name + " could not connect to mqtt:" + error);
        });

        this.mqttconnection.on("message", function (topic, message) {
            // message is Buffer
            self.prepareUpdate(topic, message.toString(), self.sendUpdateNotification)
            // client.end()
        });
    },

    sendUpdateNotification: function (self, topic, payload) {
        if (payload) {
            self.sendSocketNotification("OwntracksFriends-LOCATION-UPDATE", payload);
        } else {
            self.sendSocketNotification("OwntracksFriends-GENERAL-UPDATE", {topic: topic});
        }

    },

    prepareUpdate: function (topic, payload, callback) {
        var self = this;
        // Try to parse the String into JSON
        if (payload.length) {
            payload = JSON.parse(payload);
        } else {
            callback(self, topic, payload);
            return;
        }

        var user = topic.split("/")[1];
        var device = topic.split("/")[2];
        var gravatar_photo = null;

        if (this.config.known_friends.hasOwnProperty(user)) {
            var email_hash = crypto.createHash('md5').update(this.config.known_friends[user]).digest('hex');
            gravatar_photo = "//www.gravatar.com/avatar/" + email_hash;
        }

        var prepared_payload = {
            topic: topic,
            user: user,
            user_photo: gravatar_photo,
            device: device,
            data: payload
        };

        // No coordinates, call the callback now.
        if (!payload.hasOwnProperty('lat') || !payload.hasOwnProperty('lon')) {
            callback(self, topic, prepared_payload);
            return;
        }

        http.get({
            host: 'nominatim.openstreetmap.org',
            headers: {'user-agent': 'MagicMirror OwntracksFriends'},
            path: '/reverse?format=json&zoom=18' + "&lat=" + payload.lat + "&lon=" + payload.lon
        }, function (res) {
            var body = ''; // Will contain the final response
            // Received data is a buffer.
            // Adding it to our body
            res.on('data', function (data) {
                body += data;
            });
            // After the response is completed, parse it and log it to the console
            res.on('end', function () {
                try {
                    var parsed = JSON.parse(body);
                    prepared_payload.reverse_geo = parsed.display_name;
                    callback(self, topic, prepared_payload);
                } catch (e) {
                    console.error("OwntracksFriends: Could not reverse geocode " + payload.lat + ", " + payload.lon + ": " + e.message);
                }
            });
        })
        // If any error has occured, log error to console
            .on('error', function (e) {
                console.error("OwntracksFriends: Could not reverse geocode " + payload.lat + ", " + payload.lon + ": " + e.message);
            });
    }
});
