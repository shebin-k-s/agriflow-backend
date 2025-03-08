import Field from '../models/fieldModel.js';
import User from '../models/userModel.js';
import axios from 'axios';

export const addField = async (req, res) => {
    const { fieldName, deviceId, serialNumber, address, latitude, longitude } = req.body;

    console.log("Request body:", req.body);

    const userId = req.user.userId;
    console.log("User ID:", userId);

    try {
        if (!fieldName || !deviceId || !serialNumber || !latitude || !longitude || !address) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const existingDevice = await Field.findOne({ deviceId: deviceId.toUpperCase() });
        if (existingDevice) {
            return res.status(400).json({ message: "Device with this ID already exists" });
        }

        const today = new Date();
        const endDate = today.toISOString().split("T")[0];

        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 365);
        const startDate = pastDate.toISOString().split("T")[0];

        const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum&timezone=UTC`;

        let annualRainfall = 0;
        let annualTemperature = 0;

        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            try {
                const response = await axios.get(weatherUrl);
                const data = response.data;

                if (data && data.daily) {
                    annualRainfall = data.daily.precipitation_sum.reduce((sum, val) => sum + val, 0);
                    annualTemperature = data.daily.temperature_2m_mean.reduce((sum, val) => sum + val, 0) / data.daily.temperature_2m_mean.length;
                    success = true;
                }
            } catch (error) {
                attempts++;
                console.error(`Error fetching weather data (Attempt ${attempts}/3):`, error.message);
                if (attempts >= 3) {
                    return res.status(500).json({ message: "Failed to fetch weather data after multiple attempts" });
                }
            }
        }

        const newField = new Field({
            fieldName,
            deviceId: deviceId.toUpperCase(),
            serialNumber,
            address,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            annualRainfall,
            annualTemperature,
        });

        await newField.save();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.fields.push(newField._id);
        await user.save();

        return res.status(201).json({
            message: "Field added successfully",
            field: newField,
        });

    } catch (error) {
        console.error("Server Error:", error);

        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: errors.join(", ") });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

export const fetchFields = async (req, res) => {
    const userId = req.user.userId;
    console.log(userId);

    try {
        const user = await User.findById(userId).populate('fields');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Fields fetched successfully",
            fields: user.fields,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const updateSensorReadings = async (req, res) => {
    const { fieldId } = req.params;
    const { moisture, temperature, pH, nitrogen, phosphorus, potassium } = req.body;

    console.log("Updating sensor readings for field:", fieldId);
    console.log("Received data:", req.body);

    try {
        const field = await Field.findById(fieldId);
        if (!field) {
            return res.status(404).json({ message: "Field not found" });
        }

        field.sensorReadings = {
            moisture: moisture || field.sensorReadings.moisture,
            temperature: temperature || field.sensorReadings.temperature,
            pH: pH || field.sensorReadings.pH,
            nitrogen: nitrogen || field.sensorReadings.nitrogen,
            phosphorus: phosphorus || field.sensorReadings.phosphorus,
            potassium: potassium || field.sensorReadings.potassium,
        };
        field.sensorReadingsLastUpdated = new Date();

        await field.save();

        return res.status(200).json({
            message: "Sensor readings updated successfully",
            field: field,
        });
    } catch (error) {
        console.error("Error updating sensor readings:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const predictCropRecommendation = async (req, res) => {
    const { fieldId } = req.params;

    try {
        const field = await Field.findById(fieldId);

        console.log(field);


        if (!field) {
            return res.status(404).json({ message: "Field not found" });
        }

        if (!field.sensorReadings) {
            return res.status(400).json({ message: "Sensor readings not available for this field" });
        }

        const { nitrogen, phosphorus, potassium, pH } = field.sensorReadings;
        if (nitrogen === 0 || phosphorus === 0 || potassium === 0 || pH === 0) {
            return res.status(400).json({
                message: "Invalid sensor data: N, P, K and pH values must be greater than 0."
            });
        }
        const requestBody = {
            N: nitrogen,
            P: phosphorus,
            K: potassium,
            pH: pH,
            rainfall: field.annualRainfall,
            temperature: field.annualTemperature
        };

        console.log("Sending request to crop recommendation API:", requestBody);

        const maxRetries = 3;
        let attempts = 0;
        let success = false;
        let responseData = null;

        while (attempts < maxRetries && !success) {
            try {
                const response = await axios.post('https://crop-recommendation-owmb.onrender.com/predict', requestBody);

                if (response.status === 200 && response.data) {
                    success = true;
                    responseData = response.data.recommendations.map(({ crop, composite_score, condition_match, yield_score }) => ({
                        crop,
                        composite_score,
                        condition_match,
                        yield_score
                    }));
                } else {
                    throw new Error("Invalid response from crop recommendation API");
                }
            } catch (error) {
                attempts++;
                console.error(`Error fetching crop recommendation (Attempt ${attempts}/${maxRetries}):`, error.message);

                if (attempts >= maxRetries) {
                    return res.status(500).json({ message: "Failed to fetch crop recommendation after multiple attempts" });
                }
            }
        }


        field.cropRecommendations = responseData;
        field.cropRecommendationsLastUpdated = new Date();
        await field.save();

        console.log(responseData);


        return res.status(200).json({
            message: "Crop recommendation fetched successfully",
            recommendation: responseData
        });

    } catch (error) {
        console.error("Error fetching crop recommendation:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteField = async (req, res) => {
    const { fieldId } = req.params;
    const userId = req.user.userId;

    try {
        const field = await Field.findById(fieldId);
        if (!field) {
            return res.status(404).json({ message: "Field not found" });
        }

        // Remove the field reference from the user's fields list
        await User.findByIdAndUpdate(userId, { $pull: { fields: fieldId } });

        // Delete the field
        await Field.findByIdAndDelete(fieldId);

        return res.status(200).json({ message: "Field deleted successfully" });
    } catch (error) {
        console.error("Error deleting field:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

