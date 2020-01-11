/**
 * Event Category Model
 * Params = category_code, name, description,color,expected_hours,activity_categories
 * author = Andrew Bamidele
 * date = 16/11/2019
 *
 * updated: George Alonge
 * date = 09/12/2019
 * description = Update schema to use required attributes and model export
 * to work with MongoDB Atlas
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const eventCategories = new Schema({
  category_code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  color: {
    type: String,
    required: true
  },
  expected_hours: {
    type: Number
  },
  activity_categories: [
    {
      activity_name: {
        type: String
      },
      activity_code: {
        type: String
      }
    }
  ]
});

export default model("EventCategories", eventCategories, "eventCategories");
