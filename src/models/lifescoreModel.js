import mongoose from "mongoose";
const { Schema, model } = mongoose;
const lifescoreSchema = new Schema({
  uuid: String,
  weekInterval: {
    startOfWeek: {
      type: Date,
      required: true
    },
    endOfWeek: {
      type: Date,
      required: true
    }
  },
  lifescore: Number,
  weeklyCategories: [] // This should contain the progress bar data for that week. scores and names of each week category. e.g Productivity
});

export default model("lifescoreSchema", lifescoreSchema, "lifescoreSchema");
