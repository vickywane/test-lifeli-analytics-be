import { createEventReminder } from "./modules/PushNotifications";
// const createEventReminder = require("./modules/PushNotifications");

export const sixMorning = async () => {
  return  await createEventReminder({
    title: "😀 Good Morning! Rise and Shine",
    body: "Open Lifechitect to track sleep hours"
  })
}

export const nineMorning = async () =>
  await createEventReminder({
    title: "🚗 You survived rush hour traffic",
    body: "Open Lifechitect to track your morning routine"
  });

export const twelveAfternoon = async () =>
  await createEventReminder({
    title: "🥗 It's almost time for lunch",
    body: "Open Lifechitect to track your work hours"
  });

export const threeAfternoon = async () =>
  await createEventReminder({
    title: "🖥️ You are doing a great job",
    body: "Open Lifechitect to track your progress"
  });

export const sixEvening = async () =>
  await createEventReminder({
    title: "🏡 Welcome back home",
    body: "Open Lifechitect to track your commute"
  });

export const nineEvening = async () =>
  await createEventReminder({
    title: "🛏️ It's almost bedtime",
    body: "Open Lifechitect to track your evening routine"
  });
