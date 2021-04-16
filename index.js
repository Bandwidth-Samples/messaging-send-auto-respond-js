const BandwidthMessaging = require("@bandwidth/messaging");
const express = require("express");
const dotenv = require("dotenv").config();

const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// global vars
const port = 3000;
const accountId = process.env.BW_ACCOUNT_ID;

BandwidthMessaging.Configuration.basicAuthUserName = process.env.BW_USERNAME;
BandwidthMessaging.Configuration.basicAuthPassword = process.env.BW_PASSWORD;
var messagingController = BandwidthMessaging.APIController;

// these should be in priority order, since we'll stop when we get a match
//  make your search terms lowercase
//  structure: searchKey, response
//  "default" will be sent out if no keyword is found
const searchWords = new Map([
  ["stop", "STOP: OK, you'll no longer receive messages from us"],
  ["quit", "STOP: OK, you'll no longer receive messages from us"],
  ["help", "HELP: This is the test responder service. STOP2quit"],
  ["info", "INFO: This is the test responder service. STOP2quit"],
  ["quack", "quack quack quack STOP2quit"],
  ["default", "I'm sorry I'm not sure what to say to that STOP2quit"],
]);

/**
 * A simple method for sending a message, please disable this if you make this app public
 */
app.get("/send", async (req, res) => {
  let to_num = req.query.to_num;
  let from_num = process.env.BW_NUMBER;
  // leave hardcoded to prevent abuse if you make this script public
  let message =
    "Hi there, here is a test message from my account, please reply for autoresponder";

  try {
    var results = await sendMessage(to_num, from_num, message);
    res.send(results);
  } catch (error) {
    res
      .status(500)
      .send({ message: `failed to send a message: ${error.errorMessage}` });
  }
});

/**
 * Handle inbound callbacks from your messaging app this is called by bandwidth
 *  All messaging callbacks MUST recieve a 200 back or Bandwidth will retry until a 200 is returned (up to 24 hours)
 * In an actual implementation, all calls to this should be queued and handled elsewhere.
 */
app.post("/inbound", async (req, res) => {
  // the body contains a list of json elements (generally 1)
  req.body.forEach((item) => {
    if (item.type == "message-received") {
      dealWithInboundMessage(item);
    } else {
      // you can expect to get delivered callbacks most often here
      console.log(
        `Callback - Type: ${item.type}, from:${item.message.from} to:${item.to}`
      );
      // it's worth being verbose here
      if (item.type == "message-failed") {
        console.log(item);
      }
    }
  });

  // callbacks always get a 200 back
  res.send({
    message: "thx",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

/**
 * Here's what an inbound message looks like:
 * {
  time: '2021-01-12T18:02:57.601Z',
  type: 'message-received',
  to: '+17743453640',
  description: 'Incoming message received',
  message: {
    id: 'b6f2c939-80ac-4ce6-a92b-634098841bfb',
    owner: '+17743453640',
    applicationId: 'd2f7df40-6afc-4731-93e5-1f682500158c',
    time: '2021-01-12T18:02:57.522Z',
    segmentCount: 1,
    direction: 'in',
    to: [ '+17743453640' ],
    from: '+19197945135',
    text: 'inboiund'
  }
}
 * @param {*} item the json blob of the message we received
 */
async function dealWithInboundMessage(item) {
  console.log(
    `inbound message from:${item.message.from} text:${item.message.text}`
  );

  try {
    let to_num = item.message.from;
    let from_num = process.env.BW_NUMBER;
    let message = "[Auto-reply] " + determineAutoResponse(item.message.text);

    console.log(`sending... to:${to_num}, from:${from_num}, Body:${message}`);
    results = sendMessage(to_num, from_num, message);
  } catch (error) {
    console.log(`failed to reply to message: ${error.message}`);
    console.log(error);
  }
}

/**
 * Determine the appropriate autoresponse based on the provided text.
 *  In practice, this should call out to a list management service when STOP is received.
 * @param {*} text the text to check against
 * @return The response to provide
 */
function determineAutoResponse(text) {
  lcText = text.toLowerCase();
  resp = null;
  searchWords.forEach(function (response, searchString) {
    // if we still haven't found a match yet
    if (resp == null) {
      if (lcText.includes(searchString)) {
        resp = response;
      }
    }
  });
  if (resp == null) {
    return searchWords.get("default");
  } else {
    return resp;
  }
}

/**
 * Actually send a message, does not support MMS
 * @param {*} to_num the recipient
 * @param {*} from_num indicated as the FROM (must be a BAND number in the Location for this app)
 * @param {*} message the message you want to send to the to_num
 */
async function sendMessage(to_num, from_num, message) {
  console.log(`About to send to ${to_num} from ${from_num}`);
  var body = new BandwidthMessaging.MessageRequest({
    applicationId: process.env.BW_MESSAGING_APPLICATION_ID,
    to: [to_num],
    from: from_num,
    text: message,
  });
  // console.log(body);

  try {
    var response = await messagingController.createMessage(accountId, body);
    // console.log(response);
    return { status: "ok", id: response.id };
  } catch (error) {
    console.log(`failed to send a message: ${error.errorMessage}`);
    console.log(error);
    throw error;
  }
}
