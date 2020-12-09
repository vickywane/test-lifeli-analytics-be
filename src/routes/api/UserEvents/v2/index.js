// API's related to adding events
// description = This routes contains everything related to fetching, updating editing and deleting user events
// author = Andrew Bamidele
// date = 11/12/2019

import express from "express";
import Moment from "moment";
import { extendMoment } from "moment-range";

const moment = extendMoment(Moment);
import userEvents from "../../../../models/userEvents";
import eventAlerts from "../../../../models/eventAlerts";
import deleteEvents from "../../../../models/deleteEvents";

const getEventsForDay = (allevents, startdate) => {
  return allevents.filter((e) =>
    moment(e.time_schedule.start_time).isSame(moment(startdate), "day")
  );
};

const checkExistingDuration = (allevents, startdate, enddate) => {
  //Only check and use a subset of events that fall within the same day as the new event
  //instead of running comparison on all the users events
  //Note:: all events that span multiple nights and getting to this function will
  //fall within same day due to split of events that happen on the frontend app before hitting
  //this endpoint.

  // console.time("eventDurationCheck");
  var eventsByDay = getEventsForDay(allevents, startdate);

  var check = eventsByDay.find((event) => {
    const startplusone = moment(startdate).add(1, "second");
    const endminusone = moment(enddate).subtract(1, "second");
    const range1 = moment.range(startplusone, endminusone);
    const range2 = moment.range(
      event.time_schedule.start_time,
      event.time_schedule.end_time
    );
    return range1.overlaps(range2);
  });
  // console.log(check);
  // console.timeEnd("eventDurationCheck")
  return check;
};

const router = express.Router();
// create a new event
// Description - this route handles everything related to creation of a new event
// Author -Andrew Bamidele
// Date - 14/12/2019
router.post("/add-event", async (req, res) => {
  const {
    uuid,
    note,
    start_time,
    end_time,
    hours_spent,
    location,
    lat,
    event_url,
    lng,
    google_event_id,
    recurringEventId,
    alert_time_text,
    alert_time_value,
    repeat_time_text,
    repeat_time_value,
    repeat_time_reoccur,
    activity_category,
    activity_code,
    event_category,
    event_status,
    data_source,
    event_type,
    event_category_code,
    reminder_time,
    alert_time_code,
  } = req.body;
  const data = {
    uuid,
    note,
    recurringEventId,
    data_source,
    event_url,
    time_schedule: {
      start_time,
      end_time,
      hours_spent,
    },
    google_event_id,
    alert_time: {
      text: alert_time_text,
      val: alert_time_value,
    },
    repeat_time: {
      text: repeat_time_text,
      val: repeat_time_value,
      reoccur: repeat_time_reoccur,
    },
    location,
    lat,
    lng,
    activity_category,
    activity_code,
    event_category,
    event_status,
    event_type,
    event_category_code,
    last_updated_on: new Date(),
  };

  await userEvents.find({ uuid }, async (error, allevents) => {
    if (!error) {
      // var timeExists = checkExistingDuration(allevents, start_time, end_time);
      // if (timeExists) {
      //   return res.send({
      //     status: "error",
      //     message: `You can't create an event within an existing event timeline.`,
      //   });
      // } else {
      if (new Date(start_time).getTime() < new Date(end_time).getTime()) {
        try {
          await userEvents.create(data, (err, docs) => {
            if (err)
              res.status(400).json({ status: "error", message: err.message });
            else {
              const {
                uuid,
                alert_time,
                repeat_time,
                last_updated_on,
                description,
                name,
                ...truncatedData
              } = docs.toObject();
              const alertObj = {
                uuid,
                start_time: start_time,
                end_time,
                event_title: `${activity_category}: ${note}`,
                reminder_time,
                alert_time_code,
                event_id: truncatedData._id,
              };
              if (alert_time_code !== "none") {
                eventAlerts.create(alertObj, (err, alertData) => {
                  if (err) {
                    return res
                      .status(400)
                      .json({ status: "error", message: err.message });
                  }
                  return res.send({
                    status: "success",
                    data: truncatedData,
                    alertData,
                    message: "details added successfully",
                  });
                });
              } else {
                return res.send({
                  status: "success",
                  data: truncatedData,
                  message: "details added successfully",
                });
              }
            }
          });
          // }
        } catch (error) {
          res.status(400).json({ status: "error", message: "Invalid details" });
        }
      } else {
        return res.status(404).send({
          status: "error",
          message: "Event end date cannot be earlier than the start date",
        });
      }
      // }
    }
  });
});

router.get("/fetch-events-notifications", (req, res) => {
  const { uuid } = req.query;
  eventAlerts.find({ uuid }, (err, data) => {
    if (err) {
      return res.status(404).send({
        status: "error",
        message: "Unable to fetch notifications at this time",
      });
    }
    return res.send({
      status: "success",
      data,
    });
  });
});

// v2 Deleting a new event
// Description - this route deletes an event
// params - _id of the event
// Author -Andrew Bamidele
// Date - 08/04/2020

router.delete("/delete-user-event", async (req, res) => {
  const { uuid, event_id } = req.body;
  userEvents.findByIdAndDelete({ _id: event_id }, async (err, details) => {
    if (err) {
      return res.send({ status: "error", message: err.message });
    } else {
      const {
        time_schedule,
        alert_time,
        repeat_time,
        google_event_id,
        event_url,
        recurringEventId,
        data_source,
        uuid,
        note,
        location,
        activity_category,
        activity_code,
        event_category,
        event_status,
        event_type,
        event_category_code,
        last_updated_on,
        created_on,
      } = details;

      const deletedEvent = new deleteEvents({
        time_schedule,
        alert_time,
        repeat_time,
        google_event_id,
        event_url,
        recurringEventId,
        data_source,
        uuid,
        note,
        location,
        activity_category,
        activity_code,
        event_category,
        event_status,
        event_type,
        event_category_code,
        last_updated_on,
        created_on,
      });
      try {
        await deletedEvent
          .save()
          .then(() => {})
          .catch((e) => console.log(`err : ${e}`));
      } catch (e) {
        console.log(`Error replicating deleted event: ${e}`);
      }

      eventAlerts.findOneAndDelete({ event_id: event_id }, (err, details) => {
        return res.send({ status: "success", message: "Event Removed" });
      });
    }
  });
});

// Update an event with new details
// Description - this route deletes an event completely from the db
// params - _id of the event
// Author -Andrew Bamidele
// Date - 16/12/2019

router.post("/edit-event", async (req, res) => {
  const {
    uuid,
    event_id,
    note,
    start_time,
    end_time,
    hours_spent,
    location,
    lat,
    lng,
    alert_time_text,
    alert_time_value,
    repeat_time_text,
    repeat_time_value,
    repeat_time_reoccur,
    activity_category,
    activity_code,
    event_category,
    event_category_code,
    event_status,
    reminder_time,
    alert_time_code,
  } = req.body;
  const data = {
    uuid,
    note,
    time_schedule: {
      start_time,
      end_time,
      hours_spent,
    },
    alert_time: {
      text: alert_time_text,
      val: alert_time_value,
    },
    repeat_time: {
      text: repeat_time_text,
      val: repeat_time_value,
      reoccur: repeat_time_reoccur,
    },
    location,
    lat,
    lng,
    activity_category,
    activity_code,
    event_category,
    event_category_code,
    event_status,
    last_updated_on: new Date(),
  };

  const alertObj = {
    uuid,
    start_time: start_time,
    end_time,
    event_title: `${activity_category}: ${note}`,
    reminder_time,
    alert_time_code,
    event_id,
  };
  if (new Date(start_time).getTime() < new Date(end_time).getTime()) {
    await userEvents.findByIdAndUpdate(
      { _id: event_id },
      data,
      async (err, details) => {
        if (err) {
          return res
            .status(400)
            .json({ status: "error", message: err.message });
        } else {
          const alertExists = await eventAlerts.findOne({ event_id });
          if (alertExists) {
            eventAlerts.updateOne({ event_id }, alertObj, (err, details) => {
              if (err) {
                return res
                  .status(400)
                  .json({ status: "error", message: err.message });
              } else {
                return res.send({
                  status: "success",
                  message: "Event updated successfully",
                });
              }
            });
          } else {
            if (reminder_time) {
              eventAlerts.create(alertObj, (err, details) => {
                if (err) {
                  return res
                    .status(400)
                    .json({ status: "error", message: err.message });
                } else {
                  return res.send({
                    status: "success",
                    message: "Event updated successfully",
                  });
                }
              });
            } else {
              return res.send({
                status: "success",
                message: "Event updated successfully",
              });
            }
          }
        }
      }
    );
  } else {
    return res.status(404).send({
      status: "error",
      message: "Event end date cannot be earlier than its start date",
    });
  }
});

router.post("/update-user-event-status", (req, res) => {
  const { event_id } = req.body;
  userEvents.findByIdAndUpdate(
    { _id: event_id },
    { event_status: "confirmed" },
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(400).send({
          status: "error",
          message: "Unable to update activity at this time",
        });
      }
      return res.send({
        status: "success",
        message: "Activity has been tracked",
      });
    }
  );
});

export default router;
