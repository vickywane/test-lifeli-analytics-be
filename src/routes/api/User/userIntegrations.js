require("dotenv").config();
import express from "express";
import path from "path";
import { allSettled } from "bluebird";

import Integrations from "../../../models/integrations";
import user from "../../../models/user";
import { Auth, google } from "googleapis";
import moment from "moment";
import { json } from "body-parser";

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

// use route forwarding to get to this route
app.get("/add-google-calendar", (req, res) => {
  console.log("ADD GOOGLE CALENDAR ENDPOINT");
  const consentLink = AuthClient.generateAuthUrl({
    access_type: "offline", // required to get refresh_token
    scope: scopes,
    prompt: "consent",
    state: JSON.stringify({ userId: req.query.userId }),
  });

  // generates the consent link sent to and opened from the app

  if (req.query.code) {
    AuthClient.getToken(req.query.code).then(({ tokens }) => {
      // console.log("ADD GOOGLE CALENDAR ENDPOINT");

      const { userId } = JSON.parse(req.query.state);

      // TODO : create the calendars from here
      Integrations.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            google_calendar_token: tokens.refresh_token,
          },
        }
      )
        .lean()
        .then(() => {
          // TODO: Check if i need to setCredentials again or i can use prev creds
          AuthClient.setCredentials({ refresh_token: tokens.refresh_token });
          const calendars = [];

          // create's lifeli calendars on user's google calendar
          // TODO: Find a way to get user's location && timezone

          LifeliCalendars.forEach((name) => {
            calendars.push(
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
            );
          });

          allSettled(calendars)
            .then(() =>
              res.status(200).sendFile(path.join(__dirname + "/success.html"))
            )
            .catch((e) => {
              console.log(e , "error cerating calendars");
              res.status(500).send(e)
            });
        })
        .catch((e) => console.log(e));
    });
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

        calendars.data.items.forEach((calendar) => {
          events.push(
            google
              .calendar({ version: "v3", auth: AuthClient })
              .events.list({
                calendarId: calendar.id,
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
        });

        Promise.all(events).then(() => res.status(200).send(allEvents.flat()));
      })
      .catch((e) => res.status(404).send(e));
  }).lean();
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
    
    console.log(req.body , "request body");
    google
      .calendar({ version: "v3", auth: AuthClient })
      .calendarList.list()
      .then((result) => {
        result.data.items.forEach((calendar) => {
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
                        colorId: "6",
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
                    .catch((e) => res.status(500).send(e))
                );
              }
            });
          }
        });

        Promise.all(event).then(() =>
          res.status(200).send({ status: "SUCCESS" })
        );
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
  const { user_id } = req.body;

  user
    .findOne({ id: user_id })
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
    .then((data) => {
      // TODO: forward the route to the add-google-calendar route

      // app.get(`/add-google-calendar?userId=${user_id}`)

      res.status(200).send(data);
    })
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
