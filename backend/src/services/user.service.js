import { User } from "../models/User.js"

export const getAll = async(req, res) => {
    try {
        const users = await User.find();
        return users;
    } catch (error) {
        return error;
    }
}