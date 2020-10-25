require("dotenv").config();
import express from "express";
import path from "path";

import Integrations from "../../../models/integrations";
import user from "../../../models/user";
import { Auth, google } from "googleapis";
import Bluebird, { allSettled } from "bluebird";

const app = express.Router();

const AuthClient = new google.auth.OAuth2(
  process.env.CALENDAR_CLIENT_ID,
  process.env.CALENDAR_CLIENT_SECRET,
  process.env.CALENDAR_CALLBACK_URI
);
const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
];

const LifeliCalendars = [
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

// CALENDAR INTEGRATION ======================>

// this route is hit twice during the integration process.
// First to generate the Auth url ( consent link )
// Second as a callback_uri to get a token using the injected authorization_code
app.get("/add-google-calendar", (req, res) => {
  const consentLink = AuthClient.generateAuthUrl({
    access_type: "offline", // required to get refresh_token
    scope: scopes,
    prompt: "consent",
  });

  // generates the consent link sent to and opened from the app

  // console.log(consentLink); ===> uncomment to use or make a request to this endpoint
  if (req.query.code) {
    AuthClient.getToken(req.query.code).then(({ tokens }) => {
      // You need to save this manually for now
      console.log(tokens.refresh_token);

      // PROBLEM :- SAVE REFRESH_TOKEN UNDER THE USER WHO INITIATED THE PROCESS
      // FOR SUBSEQUENT REQUEST TO THIS SERVICE

      // TODO : create the calendars from here
      Integrations.findOneAndUpdate(
        { user_id: req.query.userId },
        {
          $set: {
            google_calendar_token: tokens.refresh_token,
          },
        }
      ).lean();
    });

    res.sendFile(path.join(__dirname + "/success.html"));
  }

  // it still hits the line even though the request lifespan should end above when the callback_uri has a code
  if (!req.query.code) {
    res.status(200).send(consentLink);
  }
});

app.post("/delete-event/:integrationId", (req, res) => {
  const { integrationId } = req.params;
  const { calendarId, eventId } = req.body;

  Integrations.findById(integrationId, (err, data) => {
    if (err) {
      res.status(404).send(err);
    }

    AuthClient.setCredentials({
      refresh_token: data.google_calendar_token,
    });

    // i might have to delete an event using the event name from here not the app
    // first pull all events => search for the event by name
    // delete the event using it's id
    google
      .calendar({ version: "v3", auth: AuthClient })
      .events.delete({ calendarId: calendarId, eventId: eventId })
      .then((deleteResponse) => res.status(200).send(deleteResponse))
      .catch((error) => res.status(500).send(error));
  }).lean();
});

// i might merge this route with `get-events` route later
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
      .calendarList.list()
      .then((calendars) => {
        const events = [];
        const allEvents = [];

        for (let i = 0; i < calendars.data.items.length; i++) {
          events.push(
            google
              .calendar({ version: "v3", auth: AuthClient })
              .events.list({
                calendarId: calendars.data.items[i].id,
              })
              .then((eventResult) => {
                // Filters out calendars not for lifeli app

                if (LifeliCalendars.includes(eventResult.data.summary)) {
                  if (eventResult.data.items.length > 0) {
                    allEvents.push(eventResult.data.items);
                  }
                }
              })
              .catch((e) => res.status(404).send(`Error : ${e}`))
          );
        }
        Promise.all(events).then(() => res.status(200).send(allEvents.flat()));
      })
      .catch((e) => res.status(404).send(e));
  }).lean();
});

app.post("/create-calendars/:integrationId", (req, res) => {
  const { integrationId } = req.params;
  const { timezone, location } = req.body;

  Integrations.findById(integrationId, (err, data) => {
    if (err) res.status(404).send(err);
    AuthClient.setCredentials({ refresh_token: data.google_calendar_token });

    LifeliCalendars.forEach((name) => {
      google
        .calendar({ version: "v3", auth: AuthClient })
        .calendars.insert({
          requestBody: {
            description: name,
            etag: "",
            kind: "calendar#calendar",
            location: location,
            summary: name,
            timeZone: timezone,
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

    const formattedName = (name) => {
      return name.split(" ").join("-").toLocaleLowerCase();
    };

    AuthClient.setCredentials({
      refresh_token: data.google_calendar_token,
    });
    const event = [];

    google
      .calendar({ version: "v3", auth: AuthClient })
      .calendarList.list()
      .then((res) => {
        res.data.items.forEach((calendar) => {
          if (LifeliCalendars.includes(calendar.summary)) {
            req.body.forEach((data) => {
              if (
                calendar.summary.toLocaleLowerCase() ===
                `li-${formattedName(data.event_category)}`
              ) {
                event.push(
                  google
                    .calendar({ version: "v3", auth: AuthClient })
                    .events.insert({
                      calendarId: calendar.id,
                      requestBody: {
                        colorId: "5",
                        description: data.event_category,
                        end: {
                          dateTime: data.time_schedule.end_time,
                        },
                        etag: "00000000000000000000",
                        kind: "calendar#event",
                        recurringEventId: "my_recurringEventId",
                        sequence: 0,
                        source: {
                          title: "Lifeli - App",
                          url: "https://liferithms.com",
                        },
                        start: {
                          dateTime: data.time_schedule.start_time,
                        },
                        status: data.status,
                        summary: data.activity_category,
                      },
                    })
                    .then(() => {
                      console.log("event created");
                    })
                    .catch((e) => console.log(e))
                );
              }
            });
          }
        });

        Promise.all(event).then(() => res.status(200));
      })
      .catch((e) => {});
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
