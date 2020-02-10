const crons = require("./src/cron");

(async () => {
  const morning = {
    title: "Good Morning! Rise and Shine",
    body: "Open Lifechitect to track sleep hours"
  };
  await crons.sixMorning(morning);
})();
