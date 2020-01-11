import mongoose from "mongoose";
import express from "express";
import EventCategories from "../../models/eventCategories";
import user from "../../models/user";

const router = express.Router();

/**
 * you can add a new event category from here
 * Params = category_code, name, description,color,expected_hours,activity_categories
 * author = Andrew Bamidele
 * date = 16/11/2019
 */
router.post("/add-event-category", async (req, res) => {
  const {
    category_code,
    name,
    description,
    color,
    expected_hours,
    activity_categories
  } = req.body;
  const data = {
    category_code,
    name,
    description,
    color,
    expected_hours,
    activity_categories
  };
  try {
    const saveEvent = await EventCategories.create(data)
      .then(async () => {
        const findEvent = await EventCategories.find();
        res.send(findEvent);
      })
      .catch(err => {
        throw err;
      });
  } catch (error) {
    res.status(404).send({ status: "error", message: error.message });
  }
});

/**
 * get all events categories
 * Params = null
 * author = Andrew Bamidele
 * date = 16/11/2019
 *
 * last update = George Alonge
 * date = 08/12/2019
 * descritpion: updated api to handle failure case
 */
router.get("/fetch-event-categories", async (req, res) => {
  const Events = await EventCategories.find();
  console.log("Events", Events);
  try {
    res.send(Events);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
