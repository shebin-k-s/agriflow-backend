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
    address: {
        type: String,
        required: true, 
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required']
        }
    },
    currentCrop: {
        type: String,
        default: "None",
    },
    sensorReadings: {
        moisture: {
            type: Number,
            default: 0
        },
        temperature: {
            type: Number,
            default: 0
        },
        pH: {
            type: Number,
            default: 0

        },
        nitrogen: {
            type: Number,
            default: 0
        },
        phosphorus: {
            type: Number,
            default: 0
        },
        potassium: {
            type: Number,
            default: 0
        },
    },
    nutrientsNeeded: {
        nitrogen: {
            type: Number,
            default: 0

        },
        phosphorus: {
            type: Number,
            default: 0
        },
        potassium: {
            type: Number,
            default: 0
        },
    },
    cropRecommendations: [
        {
            crop: String,
            composite_score: Number,
            condition_match: Number,
            yield_score: Number
        }
    ],
    annualRainfall: {
        type: Number,
        default: 0,
    },
    annualTemperature: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Field = mongoose.model("Field", fieldSchema);

export default Field;
