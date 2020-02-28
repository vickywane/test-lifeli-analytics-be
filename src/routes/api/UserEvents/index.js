// API's related to adding events
// description = This routes contains everything related to fetching, updating editing and deleting user events
// author = Andrew Bamidele
// date = 11/12/2019

import express from "express";
import userEvents from "../../../models/userEvents";
import moment from "moment";

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
    lng,
    alert_time_text,
    alert_time_value,
    repeat_time_text,
    repeat_time_value,
    repeat_time_reoccur,
    activity_category,
    activity_code,
    event_category,
    event_category_code
  } = req.body;
  const data = {
    uuid,
    note,
    time_schedule: {
      start_time,
      end_time,
      hours_spent
    },
    alert_time: {
      text: alert_time_text,
      val: alert_time_value
    },
    repeat_time: {
      text: repeat_time_text,
      val: repeat_time_value,
      reoccur: repeat_time_reoccur
    },
    location,
    lat,
    lng,
    activity_category,
    activity_code,
    event_category,
    event_category_code,
    last_updated_on: new Date()
  };

  if (new Date(start_time).getTime() < new Date(end_time).getTime()) {
    try {
      //check if events span multiple days then split into two.
      if (moment(start_time).isoWeekday() !== moment(end_time).isoWeekday()) {
        //get end of the first day for end_time of first event
        const e1 = moment(start_time)
          .endOf("day")
          .toISOString();

        //get start of the second day for start time of second event
        const s1 = moment(end_time)
          .startOf("day")
          .toISOString();

        //update end_time for first event
        const event1 = {
          uuid,
          note,
          time_schedule: {
            start_time,
            end_time: e1,
            hours_spent
          },
          alert_time: {
            text: alert_time_text,
            val: alert_time_value
          },
          repeat_time: {
            text: repeat_time_text,
            val: repeat_time_value,
            reoccur: repeat_time_reoccur
          },
          location,
          lat,
          lng,
          activity_category,
          activity_code,
          event_category,
          event_category_code,
          last_updated_on: new Date()
        };

        //update start_time for second event
        const event2 = {
          uuid,
          note,
          time_schedule: {
            start_time: s1,
            end_time,
            hours_spent
          },
          alert_time: {
            text: alert_time_text,
            val: alert_time_value
          },
          repeat_time: {
            text: repeat_time_text,
            val: repeat_time_value,
            reoccur: repeat_time_reoccur
          },
          location,
          lat,
          lng,
          activity_category,
          activity_code,
          event_category,
          event_category_code,
          last_updated_on: new Date()
        };

        //save first event,
        await userEvents.create(event1, (err, data) => {
          if (err)
            res.status(400).json({ status: "error", message: err.message });
        });

        //save second event
        await userEvents.create(event2, (err, data) => {
          if (err)
            res.status(400).json({ status: "error", message: err.message });
          else {
            res.send({
              status: "success",
              message: "details added successfully"
            });
          }
        });
      } else {
        //events belong to the same day
        await userEvents.create(data, (err, data) => {
          if (err)
            res.status(400).json({ status: "error", message: err.message });
          else {
            res.send({
              status: "success",
              message: "details added successfully"
            });
          }
        });
      }
    } catch (error) {
      res.status(400).json({ status: "error", message: "Invalid details" });
    }
  } else {
    return res.status(404).send({
      status: "error",
      message: "Event end date cannot be earlier than the start date"
    });
  }
});

// create a new event
// Description - this route handles everything fetching events for the schedule screen
// params - uuid i.e user id of logged in user
// Author -Andrew Bamidele
// Date - 14/12/2019

router.post("/fetch-user-events", (req, res) => {
  const { uuid } = req.body;
  userEvents.find(
    { uuid },
    null,
    { sort: { "time_schedule.start_time": 1 } },
    (err, details) => {
      if (err) {
        res.status(404).json({
          status: "error",
          message:
            "We couldn't fetch all of your events. But don't worry, we will try again :)"
        });
      } else {
        res.send({ status: "success", data: details });
      }
    }
  );
});

// Deleting a new event
// Description - this route deletes an event
// params - _id of the event
// Author -Andrew Bamidele
// Date - 16/12/2019

router.delete("/delete-user-event", (req, res) => {
  const { uuid, event_id } = req.body;
  userEvents.findByIdAndDelete({ _id: event_id }, (err, details) => {
    if (err) {
      return res.send({ status: "error", message: err.message });
    } else {
      res.send({ status: "success", message: "Event Removed" });
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
    event_category_code
  } = req.body;
  const data = {
    uuid,
    note,
    time_schedule: {
      start_time,
      end_time,
      hours_spent
    },
    alert_time: {
      text: alert_time_text,
      val: alert_time_value
    },
    repeat_time: {
      text: repeat_time_text,
      val: repeat_time_value,
      reoccur: repeat_time_reoccur
    },
    location,
    lat,
    lng,
    activity_category,
    activity_code,
    event_category,
    event_category_code,
    last_updated_on: new Date()
  };
  if (new Date(start_time).getTime() < new Date(end_time).getTime()) {
    userEvents.findByIdAndUpdate({ _id: event_id }, data, (err, details) => {
      if (err) {
        return res.status(400).json({ status: "error", message: err.message });
      } else {
        return res.send({
          status: "success",
          message: "Event updated successfully"
        });
      }
    });
  } else {
    return res.status(404).send({
      status: "error",
      message: "End date cannot be occur before the start date"
    });
  }
});

router.post("/search-events", (req, res) => {
  const { param, uuid } = req.body;
  var query = {
    $or: [
      { note: { $regex: param, $options: "i" } },
      { activity_category: { $regex: param, $options: "i" } }
    ]
  };
  userEvents.find(
    { uuid, ...query },
    null,
    { sort: { "time_schedule.start_time": -1 } },
    function(err, docs) {
      if (err) {
        return res.send({ status: "error", message: err.message });
      }
      console.log("Partial Search Begins");
      res.send({ status: "success", data: docs });
    }
  );
});

export default router;
