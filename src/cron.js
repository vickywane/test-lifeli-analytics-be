import { createEventReminder } from "./modules/PushNotifications";
// const createEventReminder = require("./modules/PushNotifications");
import { Expo } from "expo-server-sdk";
import mongoose from "mongoose";
// const { Schema, model } = mongoose;
import user from "./models/user";

// const MONGO_URI =
//   process.env.NODE_ENV === "production"
//     ? process.env.MONGO_URI
//     : process.env.LOCAL_MONGO_URI;

const MONGO_URI =
  "mongodb+srv://dbAdmin:&D$@Dme3n1@lifechitect-datastore-bmm9e.mongodb.net/lifechitect-stage?retryWrites=true&w=majority";

mongoose
  .connect(`${MONGO_URI}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("mongodb connected"))
  .catch(() => console.log(`unable to connect to mongo db ${MONGO_URI}`));

var User = mongoose.model("User"); // load your schema

let expo = new Expo();

export const sixMorning = ({ title, body }) => {
  console.log("about to send message with title ", title);

  let messages = [];

  try {
    User.find({}, (err, doc) => {
      if (err) {
        console.log("Error occurred retrieving users");
        return false;
      }
      console.log(doc);

      console.log("beginning loop through each users");

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
  } catch (err) {
    console.log("error occured", err);
  }

  console.log("messages ready for sending", messages);

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      console.log("sent successfully...");
    } catch (error) {
      console.error(error);
    }
  }
};

// export const nineMorning = async () =>
//   await createEventReminder({
//     title: "🚗 You survived rush hour traffic",
//     body: "Open Lifechitect to track your morning routine"
//   });

// export const twelveAfternoon = async () =>
//   await createEventReminder({
//     title: "🥗 It's almost time for lunch",
//     body: "Open Lifechitect to track your work hours"
//   });

// export const threeAfternoon = async () =>
//   await createEventReminder({
//     title: "🖥️ You are doing a great job",
//     body: "Open Lifechitect to track your progress"
//   });

// export const sixEvening = async () =>
//   await createEventReminder({
//     title: "🏡 Welcome back home",
//     body: "Open Lifechitect to track your commute"
//   });

// export const nineEvening = async () =>
//   await createEventReminder({
//     title: "🛏️ It's almost bedtime",
//     body: "Open Lifechitect to track your evening routine"
//   });
