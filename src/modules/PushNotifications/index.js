import { Expo } from "expo-server-sdk";
import user from "../../models/user";
let expo = new Expo();

export const createEventReminder = async ({title, body}) => {
  let messages = [];

  await user.find({}, (err, doc) => {
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
  // console.log(messages);
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
