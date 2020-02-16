import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { Authentication, Management } from "../../../constants/auth0";
import { Cloudinary } from "../../../constants/cloudinary";
import Datauri from "datauri";
import user from "../../../models/user";
var storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single("image");

const router = express.Router();

router.post("/update-profile-picture", (req, res) => {
  upload(req, res, function(err) {
    var datauri = new Datauri();
    if (req.file) {
      datauri.format(".jpg", req.file.buffer);
      cloudinary.uploader.upload(datauri.content, function(result) {
        if (result.public_id) {
          const { uuid } = req.body;
          var params = { id: uuid };
          var data = {
            picture: result.url
          };
          // res.send(result);
          Management.updateUserMetadata(params, data, async function(
            err,
            user
          ) {
            if (err) {
              return res
                .status(404)
                .send({ status: "error", message: err.message });
            } else {
              return res.send(user);
            }
          });
        } else {
          res.status(500).send({ status: "error", message: "service timeout" });
        }
      });
    } else {
      res.status(400).json({ status: "error", message: "No image added" });
    }
  });
});

router.post("/update-user", (req, res) => {
  const { uuid, full_name, country, email } = req.body;
  var params = { id: uuid };
  var data = {
    email
  };

  var metadata = {
    full_name: full_name,
    country
  };

  Management.updateUserMetadata(params, metadata, async function(err, user) {
    if (err) {
      return res.status(404).send({ status: "error", message: err.message });
    } else {
      if (uuid.includes("google") === false) {
        await Management.updateUser(params, data, function(err, userdata) {
          if (err) {
            return res
              .status(404)
              .send({ status: "error", message: err.message });
          } else {
            res.send(userdata);
          }
        });
      } else res.send(user);
    }
  });
});

router.post("/get-user", (req, res) => {
  const { uuid } = req.body;
  var params = { id: uuid };
  Management.getUser({ id: uuid }, function(err, user) {
    if (err) {
      res.status(400).send({ status: "error", message: err.message });
    } else {
      res.send(user);
    }
  });
});

router.post("/get-user-info", (req, res) => {
  const { uuid } = req.body;
  user.findOne({ uuid }, (err, data) => {
    if (err || data == undefined) {
      return res.status(400).send({
        status: "error",
        message: "We are unable to load your settings at this time"
      });
    }
    return res.send({ status: "success", data });
  });
});

export default router;
