import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
// get userDetails from frontend
const {fullName, email, username, password} = req.body
console.log("email", email);
// validation not empty and coreect format
// if(fullName === "") {
//     throw new ApiError(400, "Fullname is required")
// }
if(
    [fullName, email, username, password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }
// check if already exists, check with email and username
const existedUser = User.findOne({
    $or: [{ username }, { email }]
})

if(existedUser){
    throw new ApiError(409, "Username or Email already exists")
}
// check if files already exists,i.e. avatar and images
const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path

if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")}
// if available uploadthem on cloudinary, avatar
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
if(!avatar){
    throw new ApiError(400, "Avatar is required")
}
//  create user object - create entry in db
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url ||"",
    email,
    password,
    username: username.toLowerCase()
})
// remove password and refresh token field from response
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
// check for user creation
if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
}
//return res
return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successFully")

)
})

export {registerUser}