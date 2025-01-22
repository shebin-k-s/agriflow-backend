import Field from '../models/fieldModel.js';
import User from '../models/userModel.js';

export const addField = async (req, res) => {
    const { fieldName, deviceId, serialNumber } = req.body;
    console.log(req.body);

    const userId = req.user.userId;
    console.log(userId);


    try {
        if (!fieldName) {
            return res.status(400).json({ message: "Missing field name" });
        }
        if (!deviceId) {
            return res.status(400).json({ message: "Missing deviceId" });
        }
        if (!serialNumber) {
            return res.status(400).json({ message: "Missing serial number" });
        }

        const existingDevice = await Field.findOne({ deviceId: deviceId.toUpperCase() });
        if (existingDevice) {
            return res.status(400).json({ message: "Device with this ID already exists" });
        }

        const newField = new Field({
            fieldName,
            deviceId: deviceId.toUpperCase(),
            serialNumber,
        });

        await newField.save();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.fields.push(newField._id);
        await user.save();

        return res.status(201).json({
            message: "Device added successfully",
            field: newField,
        });

    } catch (error) {
        console.error(error);

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
        console.log(user);

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