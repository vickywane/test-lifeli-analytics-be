import { Expo } from "expo-server-sdk";
import user from "../../models/user";

import mongoose from "mongoose";

let expo = new Expo();

export const connInstance = () => {
  const MONGO_URI =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_URI
      : process.env.LOCAL_MONGO_URI;

  //create intermitent database connection for one time jobs
  mongoose
    .connect(`${MONGO_URI}`, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then(() => console.log("mongodb connected"))
    .catch(() => console.log(`unable to connect to mongo db ${MONGO_URI}`));

  return mongoose;
};

export const createEventReminder = async ({ title, body, timezone }) => {
  //load the User schema
  var User = connInstance().model("User");

  console.log("about to send message with title ", title);
  let messages = [];
  let timezoned_messages = [];

  await User.find({}, (err, doc) => {
    if (err) {
      return false;
    }
    for (let person of doc) {
      if (!Expo.isExpoPushToken(person.push_token)) {
        console.error(
          `Push token ${person.push_token} is not a valid Expo push token`
        );
        continue;
      }

      //Check if user belongs to requested timezone
      let user_timezone = person.notification_settings.user_timezone;

      //SEND MESSAGE TO ALL USERS IF TIMEZONE IS ALL
      if (timezone === "ALL") {
        timezoned_messages.push({
          to: person.push_token,
          sound: "default",
          title,
          body,
          data: { withSome: "data" },
          channelId: "event-creation-reminder",
        });

        console.log("about sending message for push token", person.push_token);
      } else {
        // check for timezoned messages
        if (timezone !== "" && user_timezone !== "") {
          let wild_timezone = user_timezone.split("/")[0];
          if (timezone == wild_timezone) {
            timezoned_messages.push({
              to: person.push_token,
              sound: "default",
              title,
              body,
              data: { withSome: "data" },
              channelId: "event-creation-reminder",
            });
          }
        } else {
          console.log("Error: timezone not set: ", person.push_token);
        }
      }
    }
  });

  // let chunks = expo.chunkPushNotifications(messages);

  let chunks = expo.chunkPushNotifications(timezoned_messages);

  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("ticketChunk", ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

export const createEmptyEventReminder = ({ title, body }, push_token) => {
  if (!Expo.isExpoPushToken(push_token)) {
    console.error(`Push token ${push_token} is not a valid Expo push token`);
    return false;
  }

  return {
    to: push_token,
    sound: "default",
    title,
    body,
    data: { withSome: "data" },
    channelId: "event-creation-reminder",
  };

  // let chunks = expo.chunkPushNotifications(messages);
};

export const sendEmptyEventReminders = (messages) => {
  console.log("sending chunk...");

  let chunks = expo.chunkPushNotifications(messages);

  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("ticketChunk", ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
