require("dotenv").config();
import express from "express";
import path from "path";
import moment from "moment";

import Integrations from "../../../models/integrations";
import user from "../../../models/user";
import UserEvent from "../../../models/userEvents";
import { google } from "googleapis";

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
  "Li-Career Development",
  "Li-Errand",
  "Li-Fitness",
  "Li-Personal Development",
  "Li-Relationship",
  "Li-Self Care",
  "Li-Sleep",
  "Li-Spiritual",
  "Li-Travel",
  "Li-Work & Business",
];

const eventCategories = [
  {
    name: "Li-Work & Business",
    category_code: "work-&-business",
  },
  {
    name: "Li-Career Development",
    category_code: "career-development",
  },
  {
    name: "Li-Personal Development",
    category_code: "personal-development",
  },
  {
    name: "Li-Spiritual",
    category_code: "spiritual",
  },
  { name: "Li-Fitness", category_code: "fitness" },
  {
    name: "Li-Relationship",
    category_code: "relationship",
  },
  {
    name: "Li-Self Care",
    category_code: "self-care",
  },
  { name: "Li-Sleep", category_code: "sleep" },
  {
    name: "Li-Travel",
    category_code: "travel",
  },
  { name: "Li-Errand", category_code: "errand" },
];

const getDefaultActivityCategory = (activity_category_code) => {
  switch (activity_category_code) {
    case "work-&-business":
      return "work";
    case "career-development":
      return "educate";
    case "personal-development":
      return "learn";
    case "spiritual":
      return "devotion";
    case "fitness":
      return "training";
    case "relationship":
      return "connect";
    case "self-care":
      return "leisure";
    case "errand":
      return "clean";
    case "sleep":
      return "sleep";
    case "travel":
      return "drive";
    default:
      return "";
  }
};

const capitalizeFirstLetter = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// CALENDAR INTEGRATION ======================>

// this route is hit twice during the integration process.
// First to generate the Auth url ( consent link )
// Second as a callback_uri to get a token using the injected authorization_code

// use route forwarding to get to this route
app.get("/add-google-calendar", (req, res) => {
  const consentLink = AuthClient.generateAuthUrl({
    access_type: "offline", // required to get refresh_token
    scope: scopes,
    prompt: "consent",
    state: JSON.stringify({
      userId: req.query.userId,
      timeZone: req.query.timeZone,
    }),
  });

  // generates the consent link sent to and opened from the app
  if (req.query.code) {
    AuthClient.getToken(req.query.code).then(({ tokens }) => {
      const { userId, location, timeZone } = JSON.parse(req.query.state);

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
          AuthClient.setCredentials({
            refresh_token: tokens.refresh_token,
          });
          const calendars = [];
          const calendarDetails = [];

          LifeliCalendars.forEach((name) => {
            calendars.push(
              google
                .calendar({ version: "v3", auth: AuthClient })
                .calendars.insert({
                  requestBody: {
                    description: name,
                    etag: "",
                    kind: "calendar#calendar",
                    summary: name,
                    timeZone: timeZone,
                  },
                })
                .then((calendarResponse) => {
                  eventCategories.forEach((category) => {
                    if (category.name === calendarResponse.data.summary) {
                      calendarDetails.push({
                        calendar_id: calendarResponse.data.id,
                        title: calendarResponse.data.summary,
                        event_category: category.category_code,
                        activity_category_code: getDefaultActivityCategory(
                          category.category_code
                        ),
                      });
                    }
                  });
                })
            );
          });

          Promise.all(calendars)
            .then(() => {
              Integrations.findOneAndUpdate(
                { user_id: userId },
                {
                  $set: {
                    calendar_details: calendarDetails,
                  },
                }
              )
                .lean()
                .catch((e) => console.log(e, "error setting calendar ID"));

              res.status(200).sendFile(path.join(__dirname + "/success.html"));
            })
            .catch((e) => {
              Integrations.findOneAndUpdate(
                { user_id: userId },
                {
                  $set: {
                    calendar_details: null,
                    sync_status: "failure",
                  },
                },
                (err, data) => {}
              ).lean();

              res.status(500).send(e);
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

app.post("/update-synced-event", (req, res) => {
  const { event } = req.body;
  const { eventId } = req.params;

  // console.log(event.activity_code);
  try {
    UserEvent.findById(event.event_id, (err, data) => {
      if (err) {
        res.status(404).send({
          error: `unable to find event : ${eventId}`,
        });
      }

      //Edge case : Changing the event category from the app breaks the event update cause it changes the event_id
      // After that the calendarID would not match anymore
      Integrations.findOne({ user_id: data.uuid }, (err, integrationData) => {
        if (err) {
          res.status(404).send({
            message: `integration : ${event.event_id} not found`,
          });
        }

        AuthClient.setCredentials({
          refresh_token: integrationData.google_calendar_token,
        });

        integrationData.calendar_details.forEach((integration) => {
          if (
            formattedName(integration.event_category) ===
            event.event_category_code.toLocaleLowerCase()
          ) {
            google
              .calendar({ version: "v3", auth: AuthClient })
              .events.update({
                calendarId: integration.calendar_id,
                eventId: data.google_event_id,
                requestBody: {
                  summary: `${capitalizeFirstLetter(event.activity_code)}:  ${
                    event.note
                  }`,
                  start: {
                    dateTime: event.start_time,
                  },
                  end: {
                    dateTime: event.end_time,
                  },
                },
              })
              .catch((e) => {
                res.status(500).send({ error: e });
              });
          }
        });
      })
        .then(() => {
          res.status(200).send({ status: "SUCCESS" });
        })
        .catch((e) => res.status(500).send({ error: e }));
    }).lean();
  } catch (e) {
    console.log(`an error : ${e}`);
  }
});

const formatEventCategory = (name) => {
  return name.split(" ").join("-").toLocaleLowerCase();
};

app.post("/delete-event/:userId/:eventId", (req, res) => {
  const { userId, eventId } = req.params;

  UserEvent.findById(eventId, (error, event) => {
    if (error) {
      res.status(500).send({ error: error });
    }
    Integrations.findOne({ user_id: event.uuid }, (err, integrations) => {
      try {
        integrations.calendar_details.forEach((integration) => {
          if (
            formatEventCategory(event.event_category) ===
            integration.event_category
          ) {
            AuthClient.setCredentials({
              refresh_token: integrations.google_calendar_token,
            });

            google
              .calendar({ version: "v3", auth: AuthClient })
              .events.update({
                calendarId: integration.calendar_id,
                eventId: event.google_event_id,
                requestBody: {
                  status: "cancelled",
                  end: {
                    dateTime: event.time_schedule.end_time,
                  },
                  start: {
                    dateTime: event.time_schedule.start_time,
                  },
                },
              })
              .then((deleteResponse) =>
                res.status(200).send({ response: deleteResponse })
              )
              .catch((error) => {
                console.log(error);
                res.status(500).send({ error: error });
              });
          }
        });
      } catch (e) {
        console.log(`error iterating over calendar details : ${error}`);
        res.status(500).send({ error: error });
      }
    }).lean();
  });
});

//TODO: Look into using generators to imporve nested parrallel promises
app.get("/get-events/:userId", (req, res) => {
  const { userId } = req.params;

  Integrations.find({ user_id: userId }, (err, data) => {
    if (err) {
      res.status(404).send(err);
    }

    AuthClient.setCredentials({
      refresh_token: data[0].google_calendar_token,
    });

    google
      .calendar({ version: "v3", auth: AuthClient })
      .calendarList.list({ showDeleted: false, showHidden: false })
      .then((calendars) => {
        const events = [];
        const allEvents = [];

        const rEvents = [];

        calendars.data.items.forEach((calendar) => {
          events.push(
            google
              .calendar({ version: "v3", auth: AuthClient })
              .events.list({
                calendarId: calendar.id,
              })
              .then((eventResult) => {
                // Filters out calendars not for lifeli app
                let parentReccurring;

                if (LifeliCalendars.includes(eventResult.data.summary)) {
                  if (eventResult.data.items.length > 0) {
                    eventResult.data.items.forEach((event, index) => {
                      // find the single event that was updated recurring
                      if (event.recurrence) {
                        if (!event.recurringEventId) {
                          parentReccurring = event;
                        }
                      }

                      // filters out the parent event without a `recurringEventID`
                      event.recurrence &&
                        event.recurringEventId &&
                        allEvents.push(event);

                      !event.recurrence && allEvents.push(event);

                      if (event.recurrence) {
                        // When a single event is updated to become recurring, Google doesnt return that event with a `recurringEventId`. This hack mutates the parent event and add a `recurringEventId`.

                        rEvents.push(
                          google
                            .calendar({
                              version: "v3",
                              auth: AuthClient,
                            })
                            .events.instances({
                              calendarId: calendar.id,
                              eventId: event.id,
                            })
                            .then((recurringEvents) => {
                              const currentDayNo =
                                7 - moment().isoWeekday() === 0
                                  ? 7
                                  : 7 - moment().isoWeekday();

                              try {
                                recurringEvents.data.items.forEach(
                                  (recurringEvent, index) => {
                                    const {
                                      created,
                                      start,
                                      status,
                                    } = recurringEvent;

                                    if (status !== "cancelled") {
                                      const diffFromStart = moment(
                                        start.dateTime
                                      ).diff(moment(created), "days");

                                      if (diffFromStart < currentDayNo) {
                                        if (index !== 0) {
                                          allEvents.push(recurringEvent);
                                        }

                                        if (!event.recurringEventId) {
                                          if (index === 0) {
                                            // spreading event in overwrites the previous event ID

                                            parentReccurring = {
                                              ...{
                                                recurrence:
                                                  parentReccurring.recurrence,
                                                recurringEventId: event.id,
                                              },
                                            };

                                            parentReccurring.iCalUID =
                                              recurringEvent.iCalUID;
                                            parentReccurring.etag =
                                              recurringEvent.etag;
                                            parentReccurring.end =
                                              recurringEvent.end;
                                            parentReccurring.start =
                                              recurringEvent.start;
                                            // parentReccurring.recurrence = event.recurrence;
                                            parentReccurring.reminders =
                                              recurringEvent.reminders;
                                            parentReccurring.organizer =
                                              recurringEvent.organizer;
                                            parentReccurring.kind =
                                              recurringEvent.kind;
                                            parentReccurring.status =
                                              recurringEvent.status;
                                            parentReccurring.htmlLink =
                                              recurringEvent.htmlLink;
                                            parentReccurring.created =
                                              recurringEvent.created;
                                            parentReccurring.reminders =
                                              recurringEvent.reminders;
                                            parentReccurring.sequence =
                                              event.sequence;
                                            parentReccurring.summary =
                                              event.summary;
                                            parentReccurring.creator =
                                              recurringEvent.creator;
                                            // // parentRecurringEvent's Id is same as recurringEventId
                                            parentReccurring.id =
                                              recurringEvent.recurringEventId;

                                            allEvents.push(parentReccurring);
                                          }
                                        }
                                      } else {
                                        throw new Error();
                                      }
                                    }
                                  }
                                );
                              } catch (e) {
                                // breaks out
                              }
                            })
                            .catch(() => {})
                        );
                      }
                    });
                  }
                }
              })
              .catch((e) => {
                console.log(e);
                res.status(404).send(`Error : ${e}`);
              })
          );
        });

        Promise.all(events).then(() => {
          Promise.all(rEvents).then(() => {
            res.status(200).send(allEvents.flat());
          });
        });
      })
      .catch((e) => {
        res.status(500).send(e);
      });
  }).lean();
});

const findSelfCare = (name) => {
  if (name === "li-self care") {
    return "li-selfcare";
  } else {
    return name;
  }
};

const formattedName = (name) => {
  let newName = name.split("&").join("and").toLocaleLowerCase();

  return findSelfCare(newName);
};

app.post("/create-calendar-event/:integrationId", (req, res) => {
  const { integrationId } = req.params;
  Integrations.findById(integrationId, (err, integrationData) => {
    if (err) {
      res.status(404).send(err);
    }

    AuthClient.setCredentials({
      refresh_token: integrationData.google_calendar_token,
    });
    const event = [];

    google
      .calendar({ version: "v3", auth: AuthClient })
      .calendarList.list()
      .then((result) => {
        result.data.items.forEach((calendar) => {
          if (LifeliCalendars.includes(calendar.summary)) {
            req.body.forEach((data) => {
              if (
                formattedName(calendar.summary) ===
                `li-${formattedName(data.event_category)}`
              ) {
                event.push(
                  google
                    .calendar({
                      version: "v3",
                      auth: AuthClient,
                    })
                    .events.insert({
                      calendarId: calendar.id,
                      requestBody: {
                        description: data.event_category,
                        end: {
                          dateTime: data.time_schedule.end_time,
                        },
                        etag: "00000000000000000000",
                        kind: "calendar#event",
                        sequence: 0,
                        source: {
                          title: "Lifeli - App",
                          url: "https://liferithms.com",
                        },
                        start: {
                          dateTime: data.time_schedule.start_time,
                        },
                        status: data.status,
                        summary: `${data.activity_category}: ${data.note}`,
                      },
                    })
                    .then((eventResult) => {
                      UserEvent.findByIdAndUpdate(
                        data._id,
                        {
                          google_event_id: eventResult.data.id,
                        },
                        (err, data) => {
                          if (err) {
                            console.log(err);
                          }
                        }
                      ).lean();
                    })
                    .catch((e) => {
                      res.status(500).send(e);
                    })
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

  Integrations.findOne({ user_id: userId }, (err, data) => {
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
      res.status(200).send(data);
    })
    .catch((e) => {
      res.status(422).send(`an error occured ${e}`);
    });
});

app.post("/update-integration/:user_id/:id", async (req, res) => {
  const { id, user_id } = req.params;
  const {
    autosync_enabled,
    device_type,
    google_calendar_token,
    reason_for_failure,
    sync_status,
  } = req.body;

  user
    .findOne({ id: user_id }, (err) => {
      if (err) {
        res.status(404).send(`unable to find user. Error: ${err}`);
      }
    })
    .lean();

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

app.post("/delete-integration/:userId", (req, res) => {
  const { userId } = req.params;

  Integrations.findOneAndDelete({ user_id: userId }, (err) => {
    if (err) {
      res.status(500).send({ error: "unable to delete data" });
    }
    res.status(200).send({ status: "SUCCESS" });
  }).lean();
});

export default app;
