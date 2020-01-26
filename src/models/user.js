import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  uuid: String,
  push_token: {
    type: String
  },
  activity_settings: {
    work: {
      start_time: String,
      end_time: String
    },
    sleep: {
      start_time: String,
      end_time: String
    }
  },
  notification_settings: {
    general_alerts: {
      type: Boolean,
      default: true
    },
    activity_alerts: {
      type: Boolean,
      default: true
    },
    email_alerts: {
      type: Boolean,
      default: true
    },
    sounds: {
      type: Boolean,
      default: true
    }
  },
  subscription_settings: {
    active: {
      name: String,
      description: String,
      cost: Number
    },
    free: {
      name: String,
      description: String,
      cost: Number
    },
    premium: {
      description: String,
      cost: String
    }
  },
  profile_settings: {
    date_time: String,
    avatar: String
  },
  event_category: String
});

export default model("User", userSchema);
