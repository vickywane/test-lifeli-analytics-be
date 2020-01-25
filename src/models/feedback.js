import mongoose from "mongoose";
const { Schema, model } = mongoose;

const feedbackSchema = new Schema({
  uuid: { type: String, required: true },
  description: { type: String },
  rating: { type: Number },
  created_at: { type: Date, default: Date.now }
});

export default model("FeedbackSchema", feedbackSchema, "FeedbackSchema");
