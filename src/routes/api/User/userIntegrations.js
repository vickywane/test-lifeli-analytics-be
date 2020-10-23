import express from "express";
import moment from "moment";
import path from "path";

import Integrations from "../../../models/integrations";
import user from "../../../models/user";
import { google } from "googleapis";

const app = express.Router();

const CLIENT_SECRET = "xSr1dPwnvyDcBL2PmhZDFAAV";
const CLIENT_ID =
  "649885202773-ijqmj936o916cep5ftil4be9umr1amsn.apps.googleusercontent.com";
const AuthClient = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:5000/api/v1/add-google-calendar"
);
const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
];

const Calendars = [
  "Li-Career-Development",
  "Li-Errand",
  "Li-Fitness",
  "Li-Personal Development",
  "Li-Relationship",
  "Li-Selfcare",
  "Li-Sleep",
  "Li-Spiritual",
  "Li-Travel",
  "Li-Work and Business",
];

// CALENDAR INTEGRATION
app.get("/add-google-calendar", (req, res) => {
  // USER

  let code = "";
  code = req.query.code;

  const { OAuth2 } = google.auth;

  const oAuth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "https://test-lifeli-analytics-be.herokuapp.com/api/v1/add-google-calendar"
  );

  const consentLink = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
  console.log(consentLink);

  // PROBLEM :- SAVE TOKEN UNDR

  if (req.query.code) {
    console.log(code);
    AuthClient.getToken(code).then(({ tokens }) => {
      Integrations.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            google_calendar_token: tokens.refresh_token,
          },
        }
      ).lean();
    });

    res.sendFile(path.join(__dirname + "/success.html"));
  }

  res.status(200).send(consentLink);
});

app.get("/get-calendars/:integrationId", (req, res) => {
  const { integrationId } = req.params;

  Integrations.findById(integrationId, (err, data) => {
    if (err) {
      res.status(404).send(err);
    }

    AuthClient.setCredentials({
      refresh_token: data.google_calendar_token,
    });

    google
      .calendar({ version: "v3", auth: AuthClient })
      .calendarList.list()
      .then((calendars) => {
        res.status(200).send(calendars.data);
      })
      .catch((e) => res.status(404).send(e));
  }).lean();
});

app.get("/get-events/:integrationId", (req, res) => {
  const { integrationId } = req.params;

  Integrations.findById(integrationId, (err, data) => {
    if (err) {
      res.status(404).send(err);
    }

    AuthClient.setCredentials({
      refresh_token: data.google_calendar_token,
    });

    google
      .calendar({ version: "v3", auth: AuthClient })
      .events.list({
        calendarId: "2rlnjhb6j5lm3oa2i7qcvoj2ro@group.calendar.google.com",
      })
      .then((calendars) => {
        res.status(200).send(calendars.data);
      })
      .catch((e) => res.status(404).send(`Error : ${e}`));
  }).lean();
});

app.get("/create-calendars/:integrationId", (req, res) => {
  const { integrationId } = req.params;  

  Integrations.findById(integrationId, (err, data) => {
    if (err) res.status(404).send(err);
    AuthClient.setCredentials({ refresh_token: data.google_calendar_token });

    Calendars.forEach((name) => {
      google
        .calendar({ version: "v3", auth: AuthClient })
        .calendars.insert({
          requestBody: {
            description: name,
            etag: "",
            kind: "calendar#calendar",
            location: "Lagos",
            summary: name,
            timeZone: "Africa/Lagos",
          },
        })
        .then((response) => res.status(200).send(response.data))
        .catch((e) => res.status(500).send(e));
    });
  });
});

app.post("/create-calendar-event/:integrationId", (req, res) => {
  const { integrationId } = req.params;
  Integrations.findById(integrationId, (err, data) => {
    if (err) {
      res.status(404).send(err);
    }
    const now = new Date();
    AuthClient.setCredentials({
      refresh_token: data.google_calendar_token,
    });

    const {
      colorId,
      description,
      endTime,
      startTime,
      location,
      status,
      summary,
    } = req.body;

    google
      .calendar({ version: "v3", auth: AuthClient })
      .events.insert({
        calendarId: "2rlnjhb6j5lm3oa2i7qcvoj2ro@group.calendar.google.com",
        requestBody: {
          colorId: "5",
          description: "A test sleep event",
          end: {
            dateTime: moment(new Date()).add(45, "minutes"),
          },
          etag: "00000000000000000000",
          kind: "calendar#event",
          location: "Lagos",
          recurringEventId: "my_recurringEventId",
          sequence: 0,
          source: {
            title: "Lifeli - App",
            url: "https://liferithms.com",
          },
          start: {
            dateTime: moment(new Date()),
          },
          status: "confirmed",
          summary: "test event",
        },
      })
      .then((result) => res.status(200).send(result.data))
      .catch((e) => res.status(500).send(e));
  }).lean();
});

// ==============================>
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
    .catch((e) => {
      console.log(e);
      res.status(422).send(`an error occured ${e}`);
    });
});

app.post("/update-integration/:user_id/:id", async (req, res) => {
  const { id, user_id } = req.params;
  const {
    autosync_enabled,
    device_type,
    reason_for_failure,
    sync_status,
  } = req.body;

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
        autosync_enabled: autosync_enabled,
        device_type: device_type,
        reason_for_failure: reason_for_failure,
        sync_status: sync_status,
      },
    },
    (err, data) => {
      if (err) {
        res.status(404).send("could not find user's integration");
      }
      res.status(200).send({ status: "SUCCESS", data });
    }
  ).lean();
});

export default app;
