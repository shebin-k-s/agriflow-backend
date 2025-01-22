import express from 'express'
import { forgotPassword, login, signupUser, resetPassword, sendOTP, verifyOTP } from '../controllers/userController.js'

const router = express.Router()

router.route("/send-otp")
    .post(sendOTP)
router.route("/verify-otp")
    .post(verifyOTP)

router.route("/signup")
    .post(signupUser)

router.route("/signin")
    .post(login)

router.route("/forgot-password")
    .post(forgotPassword)

router.route("/reset-password")
    .post(resetPassword)


export default router