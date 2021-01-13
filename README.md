# SMS send and auto-responder

This NodeJS app can send sms messages as well as act as an auto-responder.

### Sending SMS

This app will send a sample message out to the number specified in the query string of the call. The message is hard coded in the `index.js` code. This should not be exposed publicly as it could be abused, this is why the message text is hard coded.

### Autoresponder

This app will also respond to messages with simple logic. There is a Map defined at the top of the `index.js` file that you can modify to contain logic that makes more sense for your use.

Please note that it does not actually implement any logic to "STOP" sending messages to people although it does include STOP2quit in all messages.

Also note that auto-responders are dangerous if not monitored, they always have the potential for looping. Appropriate measures should be taken to insure you don't get into an infinite loop sending messages.

## Setting up your app

Create a Messaging Application within the Bandwidth Dashboard, you'll need to specify the callback url to the ngrok app below.

You'll also need to add at least one number to your Application. This is accomplished by creating a Location, acquiring a number, and adding that number to the location. Then you can associate that Location with the previously created Application.

### Local Setup

You'll need ngrok running, or your app to reachable on the interwebs.

```
# get the node requirements
npm install
cp .env.default .env
# the editor of champions
vi .env
```

The config values are straightforward, make sure that your FROM_NUMBER starts with a "+".

## Running it

Make sure the application is up and running and accepting requests.

```
nodemon
```

### Sending a message

```
# I want to send a message to Jenny
curl http://localhost:3000/send?to_num=15558675309
```

Note that the number here is not preceded with a "+", this is largely because with url encoding it would be a pain.

### Responding to messages

Just send a message from your phone or google voice (a popular tool amongst programmatic voice and messaging developers everywhere) into the number that you previously assigned to this application.

```
#There's no command line for this one, but it felt weird to not have a grey box here
echo "done."
```
