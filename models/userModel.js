import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6
    },
    fields: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Field',
        },
    ],
})


const User = mongoose.model('User', userSchema)


export default User