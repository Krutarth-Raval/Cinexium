import jwt from "jsonwebtoken"
import User from "../models/userModel.js"

export const optionalAuthMiddleware = async (req, res, next) => {

    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ") ){
        return next()
    }

    //token found 
    const token = authHeader.split(" ")[1]

    //is token real
    try {
        //decode token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //FETCH USER
        const user = await User.findById(decoded.id)

        //attach the user only if found
        if(user){
            req.user = user
        }

    } catch (error) {
        //invalid token, ignore it
        //do not block 
        //do not throw
    }

    //always continue
    next()
}