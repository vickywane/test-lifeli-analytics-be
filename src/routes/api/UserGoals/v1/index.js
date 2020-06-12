import express from "express";
import goalsModel from "../../../../models/goalsModel";
const router = express.Router();

router.post("/create-goal", async (req, res) => {
  const {
    uuid,
    activity_code,
    event_category_code,
    description,
    start_date,
    end_date,
    target
  } = req.body;
  const body = {
    uuid,
    activity_code,
    event_category_code,
    description,
    week_period: { start_date, end_date },
    target
  };
  const savedgoal = new goalsModel(body);
  await savedgoal
    .save()
    .then((data) => res.send({ status: "success", data }))
    .catch((err) => res.status(400).send({ status: "error", message: err }));
});

router.get("/fetch-all-goals", (req, res) => {
  const { uuid } = req.query;
  goalsModel.find({ uuid }, (err, data) => {
    if (err) {
      return res.send({ status: "error", message: "Could not find any event" });
    }
    return res.send({ status: "success", data });
  });
});

router.post("/edit-goal", (req, res) => {
  const { _id } = req.body;
  goalsModel.findOneAndUpdate({ _id }, req.body, { new: true }, (err, data) => {
    if (err) {
      return res.status(400).send({
        status: "error",
        message: "Sorry. We are unable to find this user"
      });
    } else {
      return res.send({
        status: "success",
        data
      });
    }
  });
});

router.delete("/delete-goal/:goal_id", (req, res) => {
  const { goal_id } = req.params;
  goalsModel.findOneAndDelete({ _id: goal_id }, (err, data) => {
    if (err) {
      return res.status(400).send({
        status: "success",
        message: "We can not delete this goal at this time"
      });
    }
    return res.send({
      status: "success",
      message: "You have successfully deleted this goal"
    });
  });
  //   res.send(req.params);
});

export default router;
