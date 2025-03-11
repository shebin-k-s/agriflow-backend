import express from 'express'
import { updateSensorReadings } from '../controllers/fieldController.js'

const router = express.Router()


router.route('/update-sensors/:fieldId')
    .put(updateSensorReadings)

export default router