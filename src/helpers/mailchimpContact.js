import Mailchimp from "mailchimp-api-v3";

//Add new signed up user to mailchmip
const AddToMailchimp = (email, name = "") => {
  var mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);

  mailchimp.request(
    {
      // method : 'get|post|put|patch|delete',
      method: "post",
      path: "/lists/{list_id}/members",
      path_params: {
        list_id: "f4a06f7197",
      },
      body: {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: name,
        },
      },
    },
    (err, result) => {
      if (err) {
        console.log("Couldn't subscribe user", err);
      } else {
        console.log("User Subscribed to mailchimp", result);
      }
    }
  );
};

export default AddToMailchimp;
