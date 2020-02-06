import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import auth from "./routes/api/Auth/auth";
import setUser from "./routes/api/userSettings";
import fetchPoints from "./routes/api/fetchpoints";
import profile from "./routes/api/Auth/profile";
import userevents from "./routes/api/UserEvents";
import tracking from "./routes/api/Tracking";
import lifescore from "./routes/api/Lifescore";
import feedback from "./routes/api/Feedback";
import notifications from "./routes/api/Notifications";
import { createEventReminder } from "./modules/PushNotifications";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI
    : process.env.LOCAL_MONGO_URI;

mongoose
  .connect(`${MONGO_URI}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("mongodb connected"))
  .catch(() => console.log(`unable to connect to mongo db ${MONGO_URI}`));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use("/api/v1/auth", auth);
app.use("/api/v1/settings", setUser);
app.use("/api/v1/profile", profile);
app.use("/api/v1/tracking", tracking);
app.use("/api/v1/lifescore", lifescore);
app.use("/api/v1/feedback", feedback);
app.use("/api/v1/notifications", notifications);
app.use("/api/v1", fetchPoints);
app.use("/api/v1", userevents);

app.use((req, res) => {
  res.send({ status: "error", message: "Page not found" });
});

// const notificationDuration = 1000 * 60 * 60 * 3;
// setInterval(() => {
//   createEventReminder();
// }, notificationDuration);

// setInterval(() => {
//   sixMorning
// }, 20000);

app.listen(PORT, () => console.log(`🔥  server running on port ${PORT}`));
