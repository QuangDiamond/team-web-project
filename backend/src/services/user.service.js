import { User } from "../models/users.js"

export const getAll = async(req, res) => {
    try {
        const users = await User.find();
        return users;
    } catch (error) {
        return error;
    }
}