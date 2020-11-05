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
    google_event_id , 
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
    google_event_id , 
    activity_code,
    event_category,
    event_category_code,
    last_updated_on: new Date()
  };

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
          res.send({
            status: "success",
            data: truncatedData,
            message: "Details added successfully"
          });
        }
      });
      // }
    } catch (error) {
      res.status(400).json({ status: "error", message: "Invalid details" });
    }
  } else {
    return res.status(404).send({
      status: "error",
      message: "Event end date cannot be earlier than its start date"
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
    "-uuid -alert_time -repeat_time -last_updated_on -description -name",
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
  userEvents.findOneAndDelete({ _id: event_id }, (err, details) => {
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
    function (err, docs) {
      if (err) {
        return res.send({ status: "error", message: err.message });
      }
      console.log("Partial Search Begins");
      res.send({ status: "success", data: docs });
    }
  );
});

export default router;
