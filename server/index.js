#!/usr/bin/env node

// Load config from the .env file
require("dotenv").config();

const express = require("express");
const Nexmo = require("nexmo");
const winston = require("winston");
const uuidv4 = require("uuid/v4");

// Configure logging to the console
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: function() {
        return new Date().toISOString();
      },
      formatter: function(options) {
        return (
          options.timestamp() +
          " " +
          winston.config.colorize(options.level, options.level.toUpperCase()) +
          " " +
          (options.message ? options.message : "") +
          (options.meta && Object.keys(options.meta).length
            ? "\n\t" + JSON.stringify(options.meta)
            : "")
        );
      }
    })
  ]
});
winston.level = "debug";

// The nexmo instance will be used to talk to the Voice API
const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH
});

// A map of uuid -> timeout-id.
// Can be used to cancel an impending nexmo call that has not yet been made.
const bailOutIds = {};

const app = express();
const jsonParser = express.json();

// Constructs an absolute URL given a request object and the desired path.
function absoluteURL(req, path) {
  return (
    (req.get("x-forwarded-proto") || req.protocol) +
    "://" +
    req.get("host") +
    path
  );
}

// Request a Bail Out call
// (The call is made 30 seconds after the request, to make it less suspicious)
app.post("/bail", jsonParser, (req, res) => {
  let bailOutId = uuidv4();

  logger.info("Queueing bailout");
  let timeoutId = setTimeout(() => {
    delete bailOutIds[bailOutId];

    logger.info("Triggering bailout to ", req.body.number);
    nexmo.calls.create(
      {
        to: [
          {
            type: "phone",
            number: req.body.number
          }
        ],
        from: {
          type: "phone",
          number: process.env.NEXMO_NUMBER
        },
        answer_url: [absoluteURL(req, "/bail/emergency-message")]
      },
      resp => logger.info("Response:", resp)
    );
  }, 1000);
  bailOutIds[bailOutId] = timeoutId;
  res.json({ status: "ok", id: bailOutId });
});

app.get("/bail/emergency-message", (req, res) => {
  res.json([
    {
      action: "talk",
      voiceName: "Russell",
      text: "Help! I've been arrested and I need you to bail me out!"
    }
  ]);
});

// Used to cancel an impending Bail Out call.
app.delete("/bail/:bailOutId", jsonParser, (req, res) => {
  let bailOutId = req.params.bailOutId;
  let timeoutId = bailOutIds[bailOutId];
  if (timeoutId !== undefined) {
    logger.info("Deleting bailout:", bailOutId);
    delete bailOutIds[bailOutId];
    clearTimeout(timeoutId);

    bailOutIds[bailOutId] = timeoutId;
    res.json({ status: "ok" });
  } else {
    winston.warn("BailOut not found:", bailOutId);
    res.status(404).json({ status: "error", error: "not found" });
  }
});

// Configure 404 responses to be made as JSON objects, not HTML
app.use(function(req, res, next) {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found!"
  });
});

app.listen(3000, () => {
  logger.info("BailOut Server on port 3000");
});
