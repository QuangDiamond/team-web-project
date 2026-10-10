import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: String,
    email:  String,
    password: String,
})

export const User = mongoose.model('User', userSchema);