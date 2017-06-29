/* global Module */

/* Magic Mirror
 * Module: OwntracksFriends
 *
 * By Cosmin
 * MIT Licensed.
 */

Module.register("OwntracksFriends", {
    defaults: {
        mqtt: {
            host: "mqtt://localhost:1833/",
            username: null,
            password: null
        },
        known_friends: {
            // owntracks_user: "email",
        }
    },

    requiresVersion: "2.1.0", // Required version of MagicMirror

    trackingList: {},

    start: function () {
        //Flag for check if module is loaded
        this.loaded = false;
        // Schedule update timer.
        this.sendSocketNotification("OwntracksFriends-SETUP-MQTT", this.config);
    },

    getScripts: function () {
        return [
            "moment.js"
        ]
    },
    getStyles: function () {
        return [
            this.file('OwntracksFriends.css')
        ]
    },

    // Load translations files
    getTranslations: function () {
        return {
            en: "translations/en.json",
            ro: "translations/ro.json"
        };
    },

    getDom: function () {
        // create element wrapper for show into the module
        var friendsListWrapper = document.createElement("table");
        friendsListWrapper.className = 'ot-main-list small';

        if (!this.loaded) {
            friendsListWrapper.innerHTML = this.translate("LOADING");
            friendsListWrapper.className = "dimmed light small";
            return friendsListWrapper;
        }

        // If this.trackingList is not empty
        if (this.trackingList) {
            for (var u in this.trackingList) {
                if (!this.trackingList.hasOwnProperty(u)) {
                    continue;
                }
                var data = this.trackingList[u];
                var friendWrapper = document.createElement("tr");
                friendWrapper.className = 'ot-friend-wrapper';

                var friendLabel = document.createElement("td");

                if (data.user_photo) {
                    var userp = document.createElement("img");
                    userp.src = data.user_photo;
                    userp.width = 25;
                    userp.align = "center";
                    friendLabel.appendChild(userp);
                }
                friendLabel.appendChild(document.createTextNode(data.user));

                friendLabel.title = data.device;
                friendLabel.className = 'ot-friend-label align-left';

                var locationLabel = document.createElement("td");
                locationLabel.innerHTML = data.location;
                locationLabel.className = 'ot-location-label bright';

                var timestampLabel = document.createElement("td");
                timestampLabel.className = 'ot-timestamp-label dimmed small';
                timestampLabel.innerHTML = data.when;

                friendWrapper.appendChild(friendLabel);
                friendWrapper.appendChild(locationLabel);
                friendWrapper.appendChild(timestampLabel);
                friendsListWrapper.appendChild(friendWrapper);
            }
        }
        return friendsListWrapper;
    },


    updateUserLocation: function (location_data) {
        var location = this.translate("Unknown");
        var when = this.translate("Unknown");
        var ot_raw_data = location_data.data;
        var gravatar_photo = null;

        if (ot_raw_data.hasOwnProperty('_type') && ot_raw_data._type === 'transition') {
            if (ot_raw_data.event === 'enter') {
                location = ot_raw_data.desc;
            } else {
                location = this.translate('left') + ' ' + ot_raw_data.desc;
            }
        } else if (ot_raw_data.hasOwnProperty('_type') && ot_raw_data._type === 'location') {
            location = this.translate('AWAY');
            // location = message.lat + ' ' + message.lon;
        }

        if (ot_raw_data.hasOwnProperty('tst')) {
            when = moment.unix(ot_raw_data.tst).fromNow();
        }

        this.trackingList[location_data.user] = {
            user: location_data.user,
            user_photo: location_data.user_photo,
            device: location_data.device,
            location: location,
            when: when
        };
        this.updateDom(this.config.animationSpeed);
        this.loaded = true;
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
        if (notification === "OwntracksFriends-LOCATION-UPDATE") {
            // set dataNotification
            this.updateUserLocation(payload);
        }
    }
});
