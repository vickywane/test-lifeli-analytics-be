import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const sendMail = ({ sender, receiver, template, dynamic_template_data }) => {
  const author = sender || "support@liferithm.com";
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: receiver,
    from: author,
    templateId: template,
    dynamic_template_data
  };
  sgMail.send(msg, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email Sent");
    }
  });
};

export default sendMail;
