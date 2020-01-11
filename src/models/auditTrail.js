/**
 * Event Category Model
 * Params = category_code, name, description,color,expected_hours,activity_categories
 * author = Andrew Bamidele
 * date = 21/12/2019
 *
 */

import mongoose from "mongoose";
const { Schema, model } = mongoose;

const auditTrail = new Schema({
  uuid: { type: String, required: true },
  time: {
    type: Date,
    required: true
  },
  action_name: {
    type: String,
    required: true
  },
  actor: {
    type: String,
    required: true
  },
  source_ip: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
});

export default model("AuditTrail", auditTrail, "auditTrail");
