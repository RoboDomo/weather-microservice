process.env.DEBUG = 'WeatherHost'

const debug = require('debug')('WeatherHost'),
    Config = require('./config'),
    request = require('superagent'),
    HostBase = require('microservice-core/HostBase')

const POLL_TIME = 60 * 5        // in seconds

function ctof(c) {
    return Math.round(c * (9 / 5) + 32)
}

class WeatherHost extends HostBase {
    constructor(zip) {
        const host = Config.mqtt.host,
            topic = Config.mqtt.topic

        debug('constructor', topic, zip)
        super(host, topic + '/' + zip)
        this.zip = zip
        this.poll()
    }

    async command() {
        return Promise.resolve()
    }

    async pollOnce() {
        return new Promise((resolve, reject) => {
            request
                .get('https://home.nest.com/api/0.1/weather/forecast/' + this.zip)
                .end((err, res) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(JSON.parse(res.text))
                    }
                })
        })
    }

    async poll() {
        while (1) {
            debug(this.zip, 'polling')
            try {
                const new_state = await this.pollOnce()
                new_state.now.current_temperature = ctof(new_state.now.current_temperature)
                // flatten
                this.state = new_state // { status: JSON.stringify(new_state) }
            }
            catch (e) {
                this.exception(e)
                debug('Exception', e.message, e.stack)
            }
            await this.wait(POLL_TIME * 1000)
        }
    }
}

function main() {
    const hosts = {}

    Config.weather.locations.forEach((zip) => {
        hosts[zip] = new WeatherHost(zip)
    })
}

main()


