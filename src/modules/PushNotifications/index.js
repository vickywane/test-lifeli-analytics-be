import { Expo } from "expo-server-sdk";
import user from "../../models/user";

import mongoose from "mongoose";

const MONGO_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI
    : process.env.LOCAL_MONGO_URI;

let expo = new Expo();

// const MONGO_URI =
//   "mongodb+srv://dbAdmin:&D$@Dme3n1@lifechitect-datastore-bmm9e.mongodb.net/lifechitect-stage?retryWrites=true&w=majority";

mongoose
  .connect(`${MONGO_URI}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("mongodb connected"))
  .catch(() => console.log(`unable to connect to mongo db ${MONGO_URI}`));

var User = mongoose.model("User"); // load your schema

export const createEventReminder = async ({ title, body }) => {
  console.log("about to send message with title ", title);
  let messages = [];

  await User.find({}, (err, doc) => {
    if (err) {
      return false;
    }
    for (let person of doc) {
      // console.log(person.push_token);
      if (!Expo.isExpoPushToken(person.push_token)) {
        console.error(
          `Push token ${person.push_token} is not a valid Expo push token`
        );
        continue;
      }

      console.log("push token", person.push_token);

      messages.push({
        to: person.push_token,
        sound: "default",
        title,
        body,
        data: { withSome: "data" },
        channelId: "event-creation-reminder"
      });
    }
  });
  console.log("messages ready for sending", messages);
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
