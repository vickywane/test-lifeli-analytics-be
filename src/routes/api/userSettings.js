import express from "express";
import User from "../../models/user";
import user from "../../models/user";

const router = express.Router();

router.post("/update-activity-settings", async (req, res) => {
  const { work_start, work_end, rest_start, rest_end, user_id } = req.body;
  const userExists = await User.findOne({
    uuid: user_id
  });
  if (!userExists) {
    return res
      .status(404)
      .send({ status: "error", message: "this user does not exist" });
  } else {
    await User.updateOne({
      user_id,
      activity_settings: {
        work: {
          start_time: work_start,
          end_time: work_end
        },
        sleep: {
          start_time: rest_start,
          end_time: rest_end
        }
      }
    })
      .then(() =>
        res.send({
          status: "success",
          message: "settings updated successfully"
        })
      )
      .catch(err => res.status(404).send(err));
  }
});

router.post("/update-user-settings", (req, res) => {
  const { uuid, type, value } = req.body;
  if (type === "general_alerts") {
    user.findOneAndUpdate(
      { uuid },
      { "notification_settings.general_alerts": value },
      { new: true },
      (err, data) => {
        if (err) {
          return res.send("could not update general alerts");
        }
        res.send({
          status: "success",
          data: data,
          message: "general alert changed successfully"
        });
      }
    );
  }
  if (type === "activity_alerts") {
    user.findOneAndUpdate(
      { uuid },
      { "notification_settings.activity_alerts": value },
      { new: true },
      (err, data) => {
        // console.log(data);
        if (err) {
          return res.send("could not update activity alerts");
        }
        res.send({
          status: "success",
          data: data,
          message: "activity alert changed successfully"
        });
      }
    );
  }
});

export default router;
