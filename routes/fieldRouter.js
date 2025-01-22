import express from 'express'
import { addField, fetchFields } from '../controllers/fieldController.js'

const router = express.Router()

router.route("/")
    .get(fetchFields)

router.route("/add")
    .post(addField)

export default router