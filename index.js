process.env.DEBUG = "WeatherHost";
process.title = process.env.TITLE || "weather-microservice";

const debug = require("debug")("WeatherHost"),
  Config = require("./config"),
  request = require("superagent"),
  HostBase = require("microservice-core/HostBase");

const POLL_TIME = 60 * 5; // in seconds

function ctof(c) {
  return Math.round(c * (9 / 5) + 32);
}

process.on("unhandledRejection", function(reason, p) {
  console.log(
    "Possibly Unhandled Rejection at: Promise ",
    p,
    " reason: ",
    reason
  );
});

class WeatherHost extends HostBase {
  constructor(zip) {
    const host = Config.mqtt.host,
      topic = Config.mqtt.topic;

    debug("constructor", topic, zip);
    super(host, topic + "/" + zip);
    this.zip = zip;
    this.poll();
  }

  command() {
    return Promise.resolve();
  }

  pollOnce() {
    debug("pollOnce");
    return new Promise((resolve, reject) => {
      try {
        request
          .get("https://home.nest.com/api/0.1/weather/forecast/" + this.zip)
          .end((err, res) => {
            if (err) {
              debug("err", err);
              reject(err);
            } else {
              try {
                debug(this.zip, "results", res.text);
                resolve(JSON.parse(res.text));
              } catch (e) {
                console.log("JSON exception", e.stack, e);
                reject(e);
              }
            }
          });
      } catch (e) {
        console.log("request exception", e.stack, e);
      }
    });
  }

  async poll() {
    while (1) {
      debug(this.zip, "polling");
      try {
        const new_state = await this.pollOnce();
        new_state.now.current_temperature = ctof(
          new_state.now.current_temperature
        );
        this.state = new_state;
      } catch (e) {
        this.exception(e);
        debug("Exception", e.message, e.stack);
      }
      await this.wait(POLL_TIME * 1000);
    }
  }
}

function main() {
  const hosts = {};

  Config.weather.locations.forEach(zip => {
    debug("starting", zip);
    hosts[zip] = new WeatherHost(zip);
  });
}

main();
