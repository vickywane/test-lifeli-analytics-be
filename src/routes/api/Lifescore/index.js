import express from "express";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
import userEvents from "../../../models/userEvents";
import eventCategories from "../../../models/eventCategories";
import lifescoreModel from "../../../models/lifescoreModel";

const getLifescore = (
  productivityCalc,
  wellnessCalc,
  sleepCalc,
  relationshipCalc,
  selfcareCalc,
  unpaidCalc
) => {
  const lifeScore =
    ((productivityCalc +
      wellnessCalc +
      sleepCalc +
      relationshipCalc +
      selfcareCalc +
      unpaidCalc) /
      6) *
    100;
  return lifeScore;
};
const getExpectedHours = async event_category => {
  const eHour = await eventCategories.findOne({ name: event_category });
  // console.log(eHour.expected_hours);
  return eHour.expected_hours;
};

var proData = async data => {
  var carDev = data.filter(item => item.event_category == "Career Development");
  var personalDev = data.filter(
    item => item.event_category === "Personal Development"
  );
  var work_business = data.filter(
    item => item.event_category === "Work and Business"
  );

  // console.log(carDev, personalDev, work_business);

  var cCarDev = carDev.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cPersonalDev = personalDev.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cwork_business = work_business.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);
  var cHours = cCarDev + cPersonalDev + cwork_business;

  // moment.duration(eHours).format("hh:mm", { trim: false }),
  var eHours =
    (await getExpectedHours("Career Development")) +
    (await getExpectedHours("Personal Development")) +
    (await getExpectedHours("Work and Business"));
  return {
    name: "Productivity",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#F74F5A",
    icon: "work"
  };
};

var welData = async data => {
  var fitness = data.filter(item => item.event_category == "Fitness");
  var spiritual = data.filter(item => item.event_category === "Spiritual");
  var cFitness = fitness.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cSpiritual = spiritual.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cHours = cSpiritual + cFitness;

  var eHours =
    (await getExpectedHours("Spiritual")) + (await getExpectedHours("Fitness"));
  return {
    name: "Wellness",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#F3A636",
    icon: "wellness"
  };

  // console.log(fitness);
};

var unpData = async data => {
  var errand = data.filter(item => item.event_category == "Errand");
  var travel = data.filter(item => item.event_category === "Travel");
  var cErrand = errand.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cTravel = travel.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cHours = cErrand + cTravel;

  var eHours =
    (await getExpectedHours("Errand")) + (await getExpectedHours("Travel"));

  return {
    name: "Unpaid",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#DADADA",
    icon: "unpaid"
  };

  // console.log(travel);
};

var sleData = async data => {
  var sleep = data.filter(item => item.event_category == "Sleep");
  var cSleep = sleep.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cHours = cSleep;
  var eHours = await getExpectedHours("Sleep");
  // console.log(sleep);
  return {
    name: "Sleep",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#36C0F9",
    icon: "sleep"
  };
};

var selData = async data => {
  var self_care = data.filter(item => item.event_category == "SelfCare");
  var cself_care = self_care.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cHours = cself_care;
  var eHours = await getExpectedHours("Selfcare");

  return {
    name: "Self Care",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#81D134",
    icon: "self-care"
  };
};

var relData = async data => {
  var relationship = data.filter(item => item.event_category == "Relationship");
  var crelationship = relationship.reduce((accumulator, currentValue) => {
    var start_date = moment(currentValue.time_schedule.start_time);
    var end_date = moment(currentValue.time_schedule.end_time);
    return accumulator + end_date.diff(start_date);
  }, 0);

  var cHours = crelationship;
  var eHours = await getExpectedHours("Relationship");
  // console.log(relationship);
  return {
    name: "Relationship",
    cHours: moment.duration(cHours).asHours(),
    eHours,
    color: "#27B072",
    icon: "relationship"
  };
};

const router = express.Router();

// lifescore Calculation
// description - endpoint to calculate lifescores
// params - weekstart, weekend, uuid
// Author - Andrew Bamidele

router.post("/get-weekly-lifescore", async (req, res) => {
  const { uuid, start_date, end_date } = req.body;
  lifescoreModel.findOne(
    {
      uuid,
      "weekInterval.startOfWeek": start_date,
      "weekInterval.endOfWeek": end_date
    },
    async (err, data) => {
      if (err) {
        return res.send({ status: "error", message: err.messsgae });
      } else {
        if (data === null || data.length === 0) {
          return await userEvents.find(
            {
              uuid,
              "time_schedule.start_time": {
                $gte: start_date,
                $lte: end_date
              }
            },
            async (err, data) => {
              if (err) {
                return res.send({ status: "error", message: err.message });
              } else {
                var prodValue = await proData(data);
                var welValue = await welData(data);
                var sleValue = await sleData(data);
                var selValue = await selData(data);
                var relValue = await relData(data);
                var unpValue = await unpData(data);

                const productivityCalc = () => {
                  if (prodValue.cHours > prodValue.eHours) {
                    //rounddown always rounds decimal places down. e.g 23.6 becomes 23
                    return Math.floor(prodValue.cHours / prodValue.eHours);
                  } else {
                    if (prodValue.cHours <= prodValue.eHours) {
                      return prodValue.cHours / prodValue.eHours;
                    }
                  }
                };
                const wellnessCalc = () => {
                  if (welValue.cHours > welValue.eHours) {
                    return Math.floor(welValue.cHours / welValue.eHours);
                  } else {
                    if (welValue.cHours <= welValue.eHours) {
                      return welValue.cHours / welValue.eHours;
                    }
                  }
                };

                const sleepCalc = () => {
                  if (sleValue.cHours > sleValue.eHours) {
                    return Math.floor(sleValue.cHours / sleValue.eHours);
                  } else {
                    if (sleValue.cHours <= sleValue.eHours) {
                      return sleValue.cHours / sleValue.eHours;
                    }
                  }
                };

                const relationshipCalc = () => {
                  if (relValue.cHours > relValue.eHours) {
                    return (
                      1 - (relValue.cHours - relValue.eHours) / relValue.eHours
                    );
                  } else {
                    if (relValue.cHours <= relValue.eHours) {
                      // console.log("called here");
                      return relValue.cHours / relValue.eHours;
                    }
                  }
                };

                const selfcareCalc = () => {
                  if (selValue.cHours > selValue.eHours) {
                    return (
                      1 - (selValue.cHours - selValue.eHours) / selValue.eHours
                    );
                  } else {
                    if (selValue.cHours <= selValue.eHours) {
                      return selValue.cHours / selValue.eHours;
                    }
                  }
                };

                const unpaidCalc = () => {
                  if (unpValue.cHours < unpValue.eHours) {
                    return Math.ceil(unpValue.cHours / unpValue.eHours);
                  } else {
                    if (unpValue.cHours >= unpValue.eHours) {
                      return (
                        1 -
                        (unpValue.cHours - unpValue.eHours) / unpValue.eHours
                      );
                    }
                  }
                };

                const lifescoreValue = getLifescore(
                  productivityCalc(),
                  wellnessCalc(),
                  sleepCalc(),
                  relationshipCalc(),
                  selfcareCalc(),
                  unpaidCalc()
                );
                const weeklyCategories = [
                  prodValue,
                  welValue,
                  sleValue,
                  selValue,
                  relValue,
                  unpValue
                ];

                const weekInterval = {
                  startOfWeek: start_date,
                  endOfWeek: end_date
                };

                const parsedData = {
                  uuid,
                  weeklyCategories,
                  weekInterval,
                  lifescore: lifescoreValue
                };
                const totalcHours =
                  prodValue.cHours +
                  welValue.cHours +
                  sleValue.cHours +
                  selValue.cHours +
                  relValue.cHours +
                  unpValue.cHours;
                const rndedTHours = Math.round(totalcHours);
                if (rndedTHours < 168) {
                  return res.send({
                    status: "warning",
                    cHours: totalcHours,
                    message: `You have completed ${moment
                      .duration(totalcHours, "hours")
                      .format("h:mm")} hours. Please complete ${moment
                      .duration(168 - totalcHours, "hours")
                      .format(
                        "h:mm"
                      )} hours of tracked activities weekly to get your lifescore`
                  });
                } else {
                  if (rndedTHours >= 168) {
                    await lifescoreModel.create(parsedData, (err, doc) => {
                      if (err) {
                        return res.status(400).json({ message: err });
                      }
                      return res.send({ status: "success", data: doc });
                    });
                  }
                }
              }
            }
          );
        } else {
          return res.send({ status: "success", data: data });
        }
      }
    }
  );
});

export default router;
