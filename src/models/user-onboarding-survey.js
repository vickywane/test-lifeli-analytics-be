import mongoose from "mongoose";

const { Schema, model } = mongoose;

// should i add this to the existing user schema ?
// can i just create one model instead of 10. the payload would contain 10 objects and populate them
const userOnboardingSurveySchema = {
  uuid: String,
  isCompleted: {
    type: Boolean,
    default: false,
  },
  onboardingCompeletionDate: {
    type: Date,
    default: new Date(),
  },
  survey: [
    {
      user_onboarding_survey_code: Number,
      user_onboarding_survey_name: "",
      user_onboarding_name: String,
      user_onboarding_score: String,
    },
  ],
};

export default model("UserOnboardingSurvey", userOnboardingSurveySchema);
