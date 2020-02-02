import express from "express";
import dotenv from "dotenv";
import request from "request";
dotenv.config();

import User from "../../../models/user";
import { Authentication, Management } from "../../../constants/auth0";
import sendMail from "../../../modules/emails";

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;

const router = express.Router();

const validateEmail = email => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  var data = {
    email,
    password,
    connection: "Username-Password-Authentication" // Optional field.
  };

  var newData = {
    client_id: `${AUTH0_CLIENT_ID}`, // Optional field.
    username: email,
    password,
    realm: "Username-Password-Authentication", // Optional field.
    scope: "openid" // Optional field.
  };
  const isValid = validateEmail(email);
  if (!isValid) {
    return res
      .status(400)
      .send({ status: "error", message: "email is invalid" });
  } else {
    await Management.createUser(data)
      .then(async data => {
        // res.json(data);
        const uuid = data.identities[0].user_id;
        try {
          await User.create({ uuid }).then(() => {
            Authentication.oauth.passwordGrant(newData, function(
              err,
              userData
            ) {
              if (err) {
                return res.status(404).json(err);
              }
              res.send({ status: "success", message: userData });
            });
          });
        } catch (error) {
          res
            .status(401)
            .send({ status: "error", message: "Unable to save user" });
        }
      })
      .catch(err => res.send({ status: "error", message: err.message }));
  }
});

router.post("/login", (req, res) => {
  const { email, password, device, date } = req.body;
  var data = {
    client_id: `${AUTH0_CLIENT_ID}`, // Optional field.
    username: email,
    password,
    realm: "Username-Password-Authentication", // Optional field.
    scope: "openid" // Optional field.
  };
  Authentication.oauth.passwordGrant(data, async function(err, userData) {
    if (err) {
      let newErr = JSON.parse(err.message);
      const { error_description } = newErr;
      return res
        .status(404)
        .json({ status: "error", message: error_description });
    }
    const dynamic_template_data = {
      device,
      date
    };
    let mailData = {
      receiver: email,
      template: "d-d45f15768daa4aba9aed17f0ae8bcfec",
      sender: "info@liferithms.com",
      dynamic_template_data
    };
    if (device) {
      // sendMail(mailData);
    }
    res.send({ status: "success", message: userData });
  });
});

router.post("/social-login", async (req, res) => {
  const { uuid } = req.body;
  //   if (!uuid) throw "please input a valid uuid";
  User.findOne({ uuid: uuid })
    .then(user => {
      if (!user) {
        try {
          User.create({ uuid })
            .then(() => {
              res.send({ status: "success", message: "User added" });
            })
            .catch(err => {
              throw err;
            });
        } catch (error) {
          res.status(400).json({ status: "error", message: error });
        }
      } else {
        try {
          User.updateOne({ uuid })
            .then(user => {
              res.send({ status: "success", message: "User updated" });
            })
            .catch(err => {
              throw err;
            });
        } catch (error) {
          res.status(400).json({ status: "error", message: error });
        }
      }
    })
    .catch(err => console.log(err));
});

router.post("/refresh-token", (req, res) => {
  Authentication.clientCredentialsGrant(
    {
      audience: "https://lifechitect.auth0.com/api/v2/",
      scope: "read:users update:users"
    },
    function(err, response) {
      if (err) {
        res.status(404).json(err);
        // Handle error.
      } else {
        res.send(response);
      }
    }
  );
});

router.post("/verify-email", (req, res) => {
  const { email } = req.body;
  const isValid = validateEmail(email);
  console.log("About to verify email");
  if (!isValid) {
    return res
      .status(400)
      .send({ status: "error", message: "Email is invalid" });
  } else {
    Management.getUsersByEmail(email)
      .then(function(users) {
        console.log(users);
        if (users.length === 0) {
          return res.send({ status: "success", message: "No user" });
        } else {
          return res.send({
            status: "error",
            message: "A user already exist with the provided credentials."
          });
        }
      })
      .catch(err => {
        res
          .status(406)
          .send({ status: "error", message: "server error", err: err });
        console.log("error", err);
        // console.log(AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET);
        // Handle error.
      });
  }
});

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  var options = {
    method: "POST",
    url: `https://${AUTH0_DOMAIN}/dbconnections/change_password`,
    headers: { "content-type": "application/json" },
    body: {
      // client_id: "GVNp0gbmQxPJHrGmp1IaGHc3rPPYnbxa",
      client_id: `${AUTH0_CLIENT_ID}`,
      email,
      connection: "Username-Password-Authentication"
    },
    json: true
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    res.json(body);
  });
});

export default router;
