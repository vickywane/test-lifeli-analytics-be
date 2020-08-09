import express from "express";
import userWalkthroughSchema from "../../../../models/user-walkthrough";
import User from "../../../models/user";

const router = express.Router();

router.post("/user-onboarding-servey", async (req, res) => {
  const { id, isCompleted, walkthroughs } = req.body;

  const body = {
    id,
    isCompleted,
    walkthroughs,
  };

  User.findOne({ uuid: id }).then((user) => {});

  const userOnboardSurvey = new userOnboardingSurvey(body);

  await userOnboardSurvey
    .save()
    .then((data) => res.send({ status: "success", data }))
    .catch((err) => res.status(400).send({ status: "error", message: err }));
});

export default router;
