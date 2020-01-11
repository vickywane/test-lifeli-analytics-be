import express from "express";
import mongoose from "mongoose";

import auditTrail from "../../../models/auditTrail";

const router = express.Router();

router.post("/audit-trail", (req, res) => {
  const {
    uuid,
    action_time,
    action_name,
    actor,
    source_ip,
    description
  } = req.body;

  const data = {
    uuid,
    time: action_time,
    action_name,
    actor,
    source_ip,
    description
  };
  auditTrail.create(data, (err, details) => {
    if (err) {
      return res.status(400).send({ status: "error", message: err.message });
    }
    return res.send({ status: "success", message: "Trail added" });
  });
});

export default router;
