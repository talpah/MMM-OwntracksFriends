# MMM-OwntracksFriends

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

## Installing

To install, you need to clone this repo inside the `modules/` directory:
```bash
cd modules
git clone https://github.com/talpah/MMM-OwnTracks
```
Then you need to install the dependencies using `npm` inside the cloned module:
```bash
cd MMM-OwntracksFriends
npm install
```

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-OwntracksFriends',
            config: {
                // See below for configurable options
            }
        }
    ]
}
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `mqtt`           | *Required* object containing the connection details for the Mosquitto server.
| `mqtt.host`      | *Required* connection string to access server (ie. ```mqtt://localhost:1833/```)
| `mqtt.username`  | *Optional* username for Mosquitto
| `mqtt.password`  | *Optional* password for Mosquitto
| `known_friends`  | *Optional* object containing usernames as keys and emails as values. Used for grabbing the Gravatar image.

### Full config example

```js
var config = {
    modules: [
        {
            module: 'MMM-OwntracksFriends',
            config: {
                mqtt: {
                    host: "ws://mosquitto.server.com:1883",
                    username: "mymqttlogin",
                    password: "mymqttpassword"
                },
                known_friends: {
                    kid: 'kid@example.com',
                    wife: 'wife@example.com'
                }
            }
        }
    ]
}
```
