import mongoose from "mongoose";
const { Schema, model } = mongoose;

const integrationSchema = new Schema({
    user_id: {
        type: String,
        required: true,
    },
    integration_id: String,
    provider: "",
    title: "",
    last_synced: {
        type: Date,
        default: new Date(),
    },
    sync_status: String,
    reason_for_failure: "",
    device_type: {
        required: true,
        type: String,
    },
    calendar_details: {
        type: Array,
    },
    autosync_enabled: {
        default: true,
        type: Boolean,
    },
});

export default model("Integrations", integrationSchema);
