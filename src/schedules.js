import { createEventReminder } from "./modules/PushNotifications";
import user from "./models/user";
import { Management } from "./constants/auth0";
// const createEventReminder = require("./modules/PushNotifications");

export const sixMorning = async (timezone) => {
  return await createEventReminder({
    title: "😀 Good Morning! Rise and Shine",
    body: "Open Lifechitect to track sleep hours",
    timezone: timezone,
  });
};

export const nineMorning = async (timezone) =>
  await createEventReminder({
    title: "🚗 You survived rush hour traffic",
    body: "Open Lifechitect to track your morning routine",
    timezone: timezone,
  });

export const twelveAfternoon = async (timezone) =>
  await createEventReminder({
    title: "🥗 It's almost time for lunch",
    body: "Open Lifechitect to track your work hours",
    timezone: timezone,
  });

export const threeAfternoon = async (timezone) =>
  await createEventReminder({
    title: "🖥️ You are doing a great job",
    body: "Open Lifechitect to track your progress",
    timezone: timezone,
  });

export const sixEvening = async (timezone) =>
  await createEventReminder({
    title: "🏡 Welcome back home",
    body: "Open Lifechitect to track your commute",
    timezone: timezone,
  });

export const nineEvening = async (timezone) =>
  await createEventReminder({
    title: "🛏️ It's almost bedtime",
    body: "Open Lifechitect to track your evening routine",
    timezone: timezone,
  });

const handleUserModelUpdate = (id, created_at) => {
  console.log("id", id);
  console.log("join_date", created_at);
  user.findOneAndUpdate(
    { uuid: id },
    { join_date: created_at },
    (err, data) => {
      if (err) {
        console.log("not saved");
      } else {
        console.log("saved");
      }
    }
  );
};

export const addJoinDate = () => {
  user.find((err, users) => {
    if (!err) {
      users.forEach((user) =>
        Management.getUsers({ id: `auth0|${user.uuid}` }, (error, data) => {
          if (error) {
            Management.getUsers(
              { id: `google-oauth2|${user.uuid}` },
              (error, data) => {
                if (!error) {
                  console.log("okayu");
                  handleUserModelUpdate(user.uuid, data.created_at);
                }
              }
            );
          } else {
            handleUserModelUpdate(user.uuid, data.created_at);
          }
        })
      );
      // console.log(users);
    } else {
      console.log(
        "Sorry an error occured in fetching users. Check connection to db"
      );
    }
  });
  console.log("join date");
};
