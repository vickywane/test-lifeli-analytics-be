import mongoose from "mongoose";
const { Schema, model } = mongoose;

const goalsSchema = new Schema({
  uuid: { type: String, required: true },
  activity_code: { type: String, required: true },
  event_category_code: { type: String, required: true },
  description: { type: String },
  week_period: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    }
  },
  target: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default model("goalsSchema", goalsSchema, "goalsSchema");
