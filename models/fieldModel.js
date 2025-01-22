import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
    fieldName: {
        type: String,
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
    },
    currentCrop: {
        type: String,
        default: "None"
    },

    moisture: {
        type: Number,
        default: 0,
    },
    temperature: {
        type: Number,
        default: 0,

    },
    pH: {
        type: Number,
        default: 0,

    },
    nitrogen: {
        type: Number,
        default: 0,

    },
    phosphorus: {
        type: Number,
        default: 0,

    },
    potassium: {
        type: Number,
        default: 0,

    },

})

const Field = mongoose.model('Field', fieldSchema)


export default Field