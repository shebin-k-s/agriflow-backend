import express from 'express'
import { addField, deleteField, fetchFields, predictCropRecommendation, updateSensorReadings } from '../controllers/fieldController.js'

const router = express.Router()

router.route("/")
    .get(fetchFields)

router.route("/add")
    .post(addField)

router.route("/remove/:fieldId")
    .post(deleteField)

router.route('/update-sensors/:fieldId')
    .put(updateSensorReadings)

router.route('/predict-crop/:fieldId')
    .get(predictCropRecommendation)


export default router