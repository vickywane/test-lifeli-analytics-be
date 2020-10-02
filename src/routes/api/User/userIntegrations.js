import express from "express";
import Integrations from "../../../models/integrations";
import user from "../../../models/user";

const app = express.Router();

app.get("/get-integrations/:userId", (req, res) => {
  const { userId } = req.params;

  user
    .find({ uuid: userId }, (err) => {
      if (err) {
        res.status(404).send(`unable to find user`);
      }
    })
    .lean();

  Integrations.find({ user_id: userId }, (err, data) => {
    if (err) {
      res.status(404).send(`no integrations for this user`);
    }

    res.status(200).send(data);
  }).lean();
});

app.post("/add-user-integration", async (req, res) => {
  console.log(req.body);

  user
    .findOne({ id: req.body.user_id })
    .lean()
    .then((err) => {
      if (err) {
        res.status(404).send(`unable to find user. Error: ${err}`);
      }
    })
    .catch((e) => console.log(e));

  const integration = new Integrations(req.body);

  await integration
    .save()
    .then((data) => res.status(200).send(data))
    .catch((e) => res.status(422).send(`an error occured ${e}`));
});

app.post("/update-integration/:user_id/:id", async (req, res) => {
  const { id, user_id } = req.params;

  user
    .findOne({ id: user_id })
    .lean()
    .then((err) => {
      if (err) {
        res.status(404).send(`unable to find user. Error: ${err}`);
      }
    })
    .catch((e) => console.log(e));

  Integrations.findByIdAndUpdate(
    id,
    {
      $set: {
        last_synced: new Date(),
        autosync_enabled: false,
      },
    },
    (err, data) => {
      if (err) {
        res.status(404).send("could not find user's integration");
      }
      res.status(200).send(data);
    }
  ).lean();
});

export default app;
