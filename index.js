import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import session from "express-session";


dotenv.config();

const app = express();

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 900000,
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const PORT = process.env.PORT || 5000;



mongoose.connect(process.env.CONNECTION_URL)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log(error);
    });


