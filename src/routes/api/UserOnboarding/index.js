import express from "express";
import userOnboardingSurvey from "../../../models/user-onboarding-survey";
import User from "../../../models/user";

const router = express.Router();

router.post("/user-onboarding-survey", async (req, res) => {
  const { userId, hasTakenSurvey,  surveys} = req.body;

  const body = {
    userId,
    hasTakenSurvey,
    surveys,
  };  
 
  User.findOne({ id: userId }).lean()
   .then((err) => {
    if (err) {
      res.send("User not found").status(422);
    }
   }).catch(e => {
  console.log(`Am Error Occurred while searching for user. Error: ${e}`)
  });

  const userOnboardSurvey = new userOnboardingSurvey(body);

  await userOnboardSurvey
    .save()
    .then((data) => res.send({ status: "success", data }))
    .catch((err) => res.status(400).send({ status: "error", message: err }));
});

router.get("/get-survey-status", (req, res) => {
  const { userId } = req.body;

  userOnboardingSurvey.findOne({ userId : userId }).lean()
   .then((data, err) => {
    if (err) {
      res.send("User not found").status(422);
    }
     
    res.send({  status : "success" ,  hasTakenSurvey : data.hasTakenSurvey }).status(200)
   }).catch(e => {
     res.status(400).send({ status: "error", message: err })
  });
});


export default router;
