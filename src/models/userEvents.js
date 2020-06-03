// user events model
// description = The model schema for adding user events
// author = Andrew Bamidele
// date = 11/12/2019

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userEvents = new Schema(
  {
    uuid: { type: String, ref: "User", required: true },
    name: {
      type: String
    },
    description: {
      type: String
    },
    note: {
      type: String
    },
    time_schedule: {
      start_time: { type: Date, required: true },
      end_time: { type: Date, required: true },
      hours_spent: Number
    },
    location: String,
    lat: Number,
    lng: Number,
    alert_time: {
      text: String,
      val: Date
    },
    repeat_time: {
      text: String,
      val: Date,
      reoccur: String
    },
    activity_category: { type: String, required: true },
    event_category: { type: String, required: true },
    activity_code: { type: String, required: true },
    event_category_code: { type: String, required: true },
    event_status: { type: String, enum: ["confirmed", "pending"] },
    event_type: { type: String, enum: ["tracked", "planned"] },
    data_source: {
      type: String,
      default: "IN_APP"
    },
    created_on: {
      type: Date,
      default: Date.now
    },
    last_updated_on: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true } }
);

userEvents.virtual("_user", {
  ref: "User", // The model to use
  localField: "uuid", // Find people where `localField`
  foreignField: "uuid", // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
  // options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

export default model("UserEvents", userEvents, "userEvents");
