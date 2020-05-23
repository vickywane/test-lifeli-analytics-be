import moment from "moment";
import {
  createEventReminder,
  createEmptyEventReminder,
  sendEmptyEventReminders,
} from "./modules/PushNotifications";
import user from "./models/user";
import userEvents from "./models/userEvents";
import { Management } from "./constants/auth0";
import { generateRandomInteger } from "./helpers/randomIntGenerator";
import { connInstance } from "./modules/PushNotifications";
// const createEventReminder = require("./modules/PushNotifications");

// import mongoose from "mongoose";
// import userEvents from "./models/userEvents";

// const connInstance = () => {
//   //initiate new db connection
//   const MONGO_URI =
//     process.env.NODE_ENV === "production"
//       ? process.env.MONGO_URI
//       : process.env.LOCAL_MONGO_URI;

//   //create intermitent database connection
//   mongoose
//     .connect(`${MONGO_URI}`, {
//       useNewUrlParser: true,
//       useFindAndModify: false,
//       useUnifiedTopology: true,
//     })
//     .then(() => console.log("mongodb connected"))
//     .catch(() => console.log(`unable to connect to mongo db ${MONGO_URI}`));

//   //load the User schema
//   //  return user = mongoose.model("User");
//   return mongoose;
// };

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
        console.log("could'nt update join date");
      } else {
        console.log("join date updated successfully...");
      }
    }
  );
};

const processUserJoinDate = (callback) => {
  setTimeout(callback, 1000);
};

export const addJoinDate = () => {
  const user = connInstance().model("User");
  // const user = conn.model("User");
  let counter = 0;
  user.find((err, users) => {
    if (!err) {
      console.log("total users", users.length);
      users.forEach((user) =>
        processUserJoinDate(() =>
          Management.getUsers({ id: `auth0|${user.uuid}` }, (error, data) => {
            if (error) {
              Management.getUsers(
                { id: `google-oauth2|${user.uuid}` },
                (error, data) => {
                  if (!error) {
                    console.log("google user found with id successfully...");
                    handleUserModelUpdate(user.uuid, data.created_at);
                  } else {
                    //try apple id find
                    Management.getUsers(
                      { id: `apple|${user.uuid}` },
                      (error, data) => {
                        if (!error) {
                          console.log(
                            "apple user found with id successfully..."
                          );
                          handleUserModelUpdate(user.uuid, data.created_at);
                        }
                      }
                    );
                  }
                }
              );
            } else {
              handleUserModelUpdate(user.uuid, data.created_at);
            }
            counter++;
            console.log("updated users", counter);
          })
        )
      );
    } else {
      console.log("Sorry an error occured in fetching the user.");
    }
  });
};

const getLastRunDuration = (last_time) => {
  const last_run = !last_time
    ? moment(last_time).startOf("day")
    : moment(last_time);
  const current_time = moment();
  const diff = current_time.diff(last_run);
  return Math.round(moment.duration(diff).asHours());
};

const notificationMessages = [
  {
    title: "🤓 Knowing yourself aids clarity!",
    body:
      "Clarity of life is essential to making better decisions every day towards achieving your goals and becoming your best self. Know thyself!",
  },
  {
    title: "💵 Get that Benjamins!",
    body:
      "Do you know Benjamin Franklin practiced time blocking to schedule his activities and time tracking to help him to reflect on his day?",
  },
  {
    title: "👨‍🦳🧑‍🦳 Call your grandparents!",
    body:
      "Family is everything. It’s easy to get caught up in the rat race hustling to secure that bag. Don’t leave the most important people behind. Pick up the phone.",
  },
  {
    title: "🦸🏼‍♀️🦹 Calling Superheros!",
    body:
      "When last did you do something good for someone else? If you are good at doing anything, you have superpowers. Let’s volunteer some more.",
  },
  {
    title: "🏋️‍♂️🏋️ More Muscle = Less Fat! ",
    body:
      "When last did you hit the gym? Hmmm! Likely not recently. Check out some home strength training workouts on Youtube. Then schedule it in.",
  },
  {
    title: "🏊‍♀️🚴‍♀️🏃‍♀️ Cardio for heart health!",
    body:
      "Apart from improving your endurance, running, swimming, and cycling is great for your heart. If you want to push it, sign up for a triathlon.",
  },
  {
    title: "🙏🏾🧘‍♂️ Pray or/and Meditate, both works!",
    body:
      "Do you know Spiritual activities give you energy? Yes, Spiritual Energy. Oxytocin to be specific. Get on Google to learn more about ‘happy chemicals’.",
  },
  {
    title: "🚗🚎🚝✈️ Convert Drive time to Class time! ",
    body:
      "Successful people seek to maximize every minute of the day. Many convert hours spent on Travel & Errand to Personal Development time. Try it!",
  },
  {
    title: "📖📚 Audiobooks = Print Books!",
    body:
      "Don’t have enough time to finish one book in a year? Why don’t you try finishing 52 books in 52 weeks? Eyes free self-improvement in the shower.",
  },
  {
    title: "👨‍🎓👩‍🎓 Continuing Education?",
    body:
      "Whatever you do specifically to increase your value in the marketplace and generate more income is Career Development. Go get that money!",
  },
  {
    title: "📺📱 Netflix & Chill on Social Media!",
    body:
      "Are you one of those people who watch Netflix and scroll on your favorite social media platform? Whatever floats your boat. Enjoy your Self Care!",
  },
  {
    title: "🐱🐶 Got no Friends?",
    body:
      "Yes, you do. Spending time with your pet is better than spending time with a human with negative vibes. Don’t tell them we told you so. Fetch!",
  },
  {
    title: "😴🛏 Got Sleep?",
    body:
      "What time do you go to bed? How many hours do you sleep each night? Average amount per week? Are you well-rested? Are you sure?",
  },
  {
    title: "👩‍🍳🧺🧼 Cook, Laundry, Clean!",
    body:
      "Really want to multi-task? This is when you should absolutely do it. Pair up Errands with Personal Development or Self Care activities, always!",
  },
  {
    title: "🧑‍💻👩‍💻 Work or/and Business!",
    body:
      "Schedule your Work & Business related activities. Have a start time and an end time. Take regular breaks. Track your work hours, great job!",
  },
];

export const createUserReminder = async () => {
  const user = connInstance().model("User");
  const userEvents = connInstance().model("UserEvents");
  const messages = [];

  const [getUsers, getEvents] = await Promise.all([
    user.find({}),
    userEvents.find({}, null, { sort: "-created_on" }),
  ]);

  const randomNo = generateRandomInteger(0, notificationMessages.length - 1);
  getUsers.forEach((singleuser, i) => {
    if (getLastRunDuration(singleuser.last_run) >= 6) {
      const filteredEvents = getEvents.find(
        (event) => event.uuid === singleuser.uuid
      );
      const last_event_time = filteredEvents
        ? getLastRunDuration(filteredEvents.created_on)
        : null;
      if (last_event_time >= 6 || !last_event_time) {
        console.log("scheduling notification", randomNo);
        console.log("scheduling for user", singleuser.uuid);

        //build notification messages
        let notifyObj = createEmptyEventReminder(
          notificationMessages[randomNo],
          singleuser.push_token
        );
        if (notifyObj !== false) {
          messages.push(notifyObj);
        }

        //update user model and continue
        user.findOneAndUpdate(
          { uuid: singleuser.uuid },
          { last_run: new Date() },
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    }
  });

  //send messages
  sendEmptyEventReminders(messages);

  return;
};
