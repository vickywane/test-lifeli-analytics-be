import express from "express";
import goalsModel from "../../../../models/goalsModel";
import * as Lodash from "lodash";
import moment from "moment";
import { extendMoment } from "moment-range";

const momentRange = extendMoment(moment);
const router = express.Router();

router.post("/create-goal", async (req, res) => {
  const {
    uuid,
    activity_code,
    event_category_code,
    description,
    start_date,
    end_date,
    target,
  } = req.body;
  const body = {
    uuid,
    activity_code,
    event_category_code,
    description,
    week_period: { start_date, end_date },
    target,
  };
  const savedgoal = new goalsModel(body);
  await savedgoal
    .save()
    .then((data) => res.send({ status: "success", data }))
    .catch((err) => res.status(400).send({ status: "error", message: err }));
});

const isPaginatedGoal = (goal, pager) => {
  const { week_period, created_at, event_category_code } = goal;

  const goalAge = moment(moment(created_at)).diff(
    moment(week_period.start_date),
    "weeks"
  );

  if (goalAge < pager * 3) {
    const weekStart =
      pager == 1 //default
        ? moment(new Date())
        : moment(new Date()).subtract(Math.round((pager * 3) / 2), "weeks");

    const weekEnd = moment(new Date())
      .subtract(pager * 3, "weeks")
      .toDate();

    const weekRange = momentRange.range(weekEnd, weekStart);
    console.log(
      weekRange.contains(week_period.start_date),
      "date range",
      event_category_code,
      goalAge
    );
    return weekRange.contains(week_period.start_date);
  }
};

router.get("/fetch-all-goals", (req, res) => {
  const { uuid, weekInterval } = req.query;
  goalsModel.find({ uuid }, null, { sort: { created_at: -1 } }, (err, data) => {
    if (err) {
      return res.send({ status: "error", message: "Could not find any event" });
    }

    const filtered = Lodash.filter(data, (goal) =>
      isPaginatedGoal(goal, weekInterval)
    );

    return res.send({ status: "success", data: filtered });
  });
});

router.post("/edit-goal", (req, res) => {
  const { _id } = req.body;
  goalsModel.findOneAndUpdate({ _id }, req.body, { new: true }, (err, data) => {
    if (err) {
      return res.status(400).send({
        status: "error",
        message: "Sorry. We are unable to find this user",
      });
    } else {
      return res.send({
        status: "success",
        data,
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
        message: "An error occurred. We can't delete this item",
      });
    }
    return res.send({
      status: "success",
      message: "You have successfully removed this goal",
    });
  });
  //   res.send(req.params);
});

export default router;
