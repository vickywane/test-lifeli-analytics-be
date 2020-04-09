import mongoose from "mongoose";

const { Schema, model } = mongoose;

const eventAlerts = new Schema({
  uuid: String,
  event_title: String,
  event_id: String,
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  alert_time_code: String,
  reminder_time: { type: Date, required: false }
});

export default model("eventAlerts", eventAlerts, "eventAlerts");
