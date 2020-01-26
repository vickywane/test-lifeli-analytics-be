import express from "express";
import user from "../../../models/user";

const router = express.Router();

router.post("/send-push-token", async (req, res) => {
  const { uuid, push_token } = req.body;
  await user.findOneAndUpdate({ uuid }, { push_token }, (err, docs) => {
    if (err) {
      return res
        .status(400)
        .send({ status: "error", message: "invalid push token" });
    }
    return res.send(docs);
  });
});

export default router;
