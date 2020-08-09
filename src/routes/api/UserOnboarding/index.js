import express from "express";
import userOnboardingSurvey from "../../../models/user-onboarding-survey";
import User from "../../../models/user";

const router = express.Router();

router.post("/user-onboarding-survey", async (req, res) => {
  const { userId, isCompleted, walkthroughs } = req.body;

  const body = {
    userId,
    isCompleted,
    walkthroughs,
  };

  User.findOne({ uuid: userId }).then((err) => {
    if (err) {
      res.send("User not found").status(422);
    }
  });

  const userOnboardSurvey = new userOnboardingSurvey(body);

  await userOnboardSurvey
    .save()
    .then((data) => res.send({ status: "success", data }))
    .catch((err) => res.status(400).send({ status: "error", message: err }));
});

export default router;
