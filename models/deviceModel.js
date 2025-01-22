const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
    },
    fieldData: {
        moisture: {
            type: Number,
            required: true,
        },
        temperature: {
            type: Number,
            required: true,
        },
        pH: {
            type: Number,
            required: true,
        },
        nitrogen: {
            type: Number,
            required: true,
        },
        phosphorus: {
            type: Number,
            required: true,
        },
        potassium: {
            type: Number,
            required: true,
        },
    },

})

const Device = mongoose.model('Device', deviceSchema)


export default Device