import { createEventReminder } from "./modules/PushNotifications";
// const createEventReminder = require("./modules/PushNotifications");

export const sixMorning = async timezone => {
  return await createEventReminder({
    title: "😀 Good Morning! Rise and Shine",
    body: "Open Lifechitect to track sleep hours",
    timezone: timezone
  });
};

export const nineMorning = async timezone =>
  await createEventReminder({
    title: "🚗 You survived rush hour traffic",
    body: "Open Lifechitect to track your morning routine",
    timezone: timezone
  });

export const twelveAfternoon = async timezone =>
  await createEventReminder({
    title: "🥗 It's almost time for lunch",
    body: "Open Lifechitect to track your work hours",
    timezone: timezone
  });

export const threeAfternoon = async timezone =>
  await createEventReminder({
    title: "🖥️ You are doing a great job",
    body: "Open Lifechitect to track your progress",
    timezone: timezone
  });

export const sixEvening = async timezone =>
  await createEventReminder({
    title: "🏡 Welcome back home",
    body: "Open Lifechitect to track your commute",
    timezone: timezone
  });

export const nineEvening = async timezone =>
  await createEventReminder({
    title: "🛏️ It's almost bedtime",
    body: "Open Lifechitect to track your evening routine",
    timezone: timezone
  });
