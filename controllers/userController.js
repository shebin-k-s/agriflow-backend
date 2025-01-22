import User from "../models/userModel.js"
import bcrypt from 'bcrypt'
import Jwt from "jsonwebtoken";
import nodemailer from 'nodemailer'


export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required for registration' });
        }


        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("User already registered.");
            return res.status(409).json({ message: 'Email is already registered. Please log in.' });
        }


        const otp = generateOTP();
        req.session.otp = otp;
        req.session.email = email;

        req.session.otpVerified = false;

        const sessionId = req.sessionID;

        await sendEmail(email, otp);


        return res.status(200).json({ message: 'OTP sent successfully', sessionId });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const verifyOTP = async (req, res) => {
    try {
        const { otp, sessionId } = req.body
        const getSessionData = (sid) => {
            return new Promise((resolve, reject) => {
                req.sessionStore.get(sid, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        };

        const sessionData = await getSessionData(sessionId);
        if (otp !== sessionData.otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        sessionData.otpVerified = true;
        const saveSessionData = (sid, data) => {
            return new Promise((resolve, reject) => {
                req.sessionStore.set(sid, data, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        await saveSessionData(sessionId, sessionData);

        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

export const sendEmail = async (email, otp) => {

    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        const mailOptions = {
            from: "Agri Flow",
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw new Error('Failed to send Email OTP ');
    }
};

export const signupUser = async (req, res) => {
    const { fullName, password, sessionId } = req.body

    console.log(req.body);



    try {
        const getSessionData = (sid) => {
            return new Promise((resolve, reject) => {
                req.sessionStore.get(sid, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        };
        const sessionData = await getSessionData(sessionId);

        if (!sessionData.otpVerified) {
            return res.status(400).json({ message: "Email not verified" });
        }




        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
            email: sessionData.email,
            fullName,
            password: hashedPassword
        });


        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.log(error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: errors.join(", ") });
        }
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const login = async (req, res) => {

    const { email, password } = req.body;

    try {

        if (!email || !password) {
            return res.status(404).json({ message: email ? "Password is required" : "Email is required" })
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Email doesn't exist" })
        }
        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) {

            return res.status(401).json({ message: "Incorrect Password" })
        } else {
            const token = Jwt.sign({ userId: user._id, role: "User" }, process.env.JWT_TOKEN);
            return res.status(200).json({
                message: "Login Successfull",
                token: token,
                fullName: user.fullName,
                email: user.email
            })
        }


    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: errors.join(", ") });
        }
        return res.status(500).json({ message: "Internal server error" })

    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;


    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }

        const otp = generateOTP();
        req.session.otp = otp;
        req.session.email = email;

        req.session.otpVerified = false;

        const sessionId = req.sessionID;


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log(otp);
        

        const mailOptions = {
            from: "Agri Flow",
            to: user.email,
            subject: 'Password Reset',
            text: `Your OTP for reseting password is\n ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);

                return res.status(500).json({ message: 'Failed to send reset password email' });
            } else {
                return res.status(200).json({ message: 'Reset password OTP sent to email', sessionId });
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { sessionId, password } = req.body;
    try {
        const getSessionData = (sid) => {
            return new Promise((resolve, reject) => {
                req.sessionStore.get(sid, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        };
        const sessionData = await getSessionData(sessionId);

        if (!sessionData.otpVerified) {
            return res.status(400).json({ message: "Email not verified" });
        }


        let user = await User.findOne({ email: sessionData.email });

        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }



        const hashedPassword = bcrypt.hashSync(password, 10);

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({ message: 'Password reset successful' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });

    }
}