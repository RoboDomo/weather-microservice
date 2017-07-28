module.exports = {
    mqtt:  {
        // host where mqtt server resides
        // You can add an entry to this server's /etc/hosts to point
        // the name 'ha' at the mqtt server, or set the MQTTHOST env
        // variable with your mqtt connect string.
        host:  process.env.MQTTHOST || 'mqtt://ha',
        // This is the base of the topic used to publish/subscribe.
        // For example, autelis/# (on the client) to listen to all updates
        // or autelis/jets to listen for events about the Spa jets.
        // Client can turn on the jets with
        //      topic: autelist/jets
        //      message: on
        //
        topic: process.env.topic || 'weather',
    },
    weather : {
        locations: process.env.locations ? process.env.locations.split(',') : [
            '92211',    // Palm Desert CA, it's HOT!!!
        ]
    },
}