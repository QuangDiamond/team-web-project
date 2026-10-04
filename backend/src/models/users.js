import { mongoose } from "mongoose";

const userSchema = mongoose.Schema({
    username: String,
    plan: String,
    status: String
})

export const User = mongoose.model('User', userSchema);