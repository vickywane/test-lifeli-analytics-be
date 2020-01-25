import express from "express";
import FeedbackSchema from "../../../models/feedback";
import sendMail from "../../../modules/emails";

const router = express.Router();

router.post("/add-feedback", async (req, res) => {
  const { uuid, description, rating } = req.body;
  const data = { uuid, description, rating };
  //   console.log(data);
  await FeedbackSchema.create(data, (err, doc) => {
    if (err) {
      return res.status(400).send({ status: "error", message: err.message });
    }
    sendMail({
      receiver: "george@liferithms.com",
      template: "d-c48ec0e4df364b8ca8942adb3c1ca3e1",
      dynamic_template_data: { description: description }
    });
    return res.send({
      status: "success",
      message: "Thanks. Your feedback has been noted"
    });
  });
});

export default router;
