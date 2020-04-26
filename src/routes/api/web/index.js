import express from "express";
import moment from "moment";
import userEvents from "../../../models/userEvents";
import user from "../../../models/user";
import eventAlerts from "../../../models/eventAlerts";

const router = express.Router();

// function getUserEvents(uuid) {
//   const events = userEvents.find({ uuid });
//   return events;
// }

router.get("/fetch-all-events", async (req, res) => {
  await userEvents
    .find({})
    .select("uuid time_schedule note event_category created_on")
    .populate({
      path: "_user",
      select: "uuid notification_settings.user_timezone"
    })
    .exec((err, data) => {
      if (err) {
        return res.status(400).send({
          status: "error",
          message: "An error occurred while attempting to pull events"
        });
      }
      return res.send({ status: "success", data });
    });
});

// router.get("/fetch-user-activities", async (req, res) => {
//   await userEvents
//     .find({})
//     .populate({
//       path: "_user",
//       select: "uuid notification_settings.user_timezone"
//     })
//     .exec((err, data) => {
//       if (err) {
//         return res.status(400).json(err);
//       }
//       return res.send({ status: "success", data });
//     });
//   // const [getAllUsers, getUserEvents] = await Promise.all([
//   //   user.find({}),
//   //   userEvents.find({})
//   // ]);
//   // const allusers = [];
//   // getAllUsers.forEach(async (user) => {
//   //   const eventsPerUser = getUserEvents.filter(
//   //     (event) => event.uuid === user.uuid
//   //   );
//   //   const hoursTracked = eventsPerUser.reduce((acc, currentValue) => {
//   //     const start_time = moment(currentValue.time_schedule.start_time);
//   //     const end_time = moment(currentValue.time_schedule.end_time);

//   //     return moment.duration(end_time.diff(start_time)).asHours() + acc;
//   //   }, 0);

//   //   allusers.push({
//   //     uuid: user.uuid,
//   //     timezone: user.notification_settings.user_timezone,
//   //     no_of_events: eventsPerUser.length || 0,
//   //     hoursTracked
//   //   });
//   // });

//   // return res.send({ status: "success", data: allusers });
// });

router.get("/fetch-all-users", (req, res) => {
  user
    .find({})
    .select("uuid join_date notification_settings.user_timezone")
    .exec((err, data) => {
      if (err) {
        return res.status(400).send({
          status: "error",
          message: "Unable to complete fetching of events"
        });
      }
      return res.send({ status: "success", data });
    });
});

router.get("/fetch-all-reminders", (req, res) => {
  eventAlerts.find({}).exec((error, data) => {
    if (error) {
      res.status(400).send({
        status: "error",
        message: "Unable to fetch reeminders at this time"
      });
    }

    return res.send({ status: "success", data });
  });
});

export default router;
