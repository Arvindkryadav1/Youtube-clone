import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}

    } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refresh token")
      console.log(error)
    }
}

const registerUser = asyncHandler( async (req, res) => {
// get user Details from frontend
const {fullName, email, username, password} = req.body
// console.log("email", email);
// validation not empty and correct format
// if(fullName === "") {
//     throw new ApiError(400, "Fullname is required")
// }
if(
    [fullName, email, username, password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }
// check if already exists, check with email and username
const existedUser = await User.findOne({
    $or: [{ username }, { email }]
})

if(existedUser){
    throw new ApiError(409, "Username or Email already exists")
}
// check if files already exists,i.e. avatar and images
const avatarLocalPath = req.files?.avatar[0]?.path
// const coverImageLocalPath = req.files?.coverImage[0]?.path

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
}

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


const loginUser = asyncHandler(async (req, res) => {
    // get data from req.body
    const { email, username, password } = req.body;
  
    // check if username and password
    if (!username && !email) {
      throw new ApiError(400, "username or password is required");
    }
  
    // check if there is a registered user
    const user = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });
  
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
  
    // password check if user
    const isPasswordValid = await user.isPasswordCorrect(password);
  
    if (!isPasswordValid) {
      throw new ApiError(401, "Enter the correct password");
    }
  
    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)  
    // send cookie and response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
    const options = {
      httpOnly: true,
      secure: true
    };
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken
          },
          "User logged in successfully"
        )
      );
  });
  

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }     
  )
  const options = {
    httpOnly: true,
    secure: true
   } 

   return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "Logged Out Successfully"))

})

const refreshAccessToken = asyncHandler( async (req, res) => {
  //get refreshToken from cookies or incase of mobile from body
  const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   // if no incoming refresh token
  if(!inComingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }
 // if there is a refresh token, verify
 try {
   const decodedToken = jwt.verify(
     inComingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
   
   const user = await User.findById(decodedToken?._id)
   if(!user){
     throw new ApiError(401, "Invalid refresh Token")
   }
   if(inComingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "refresh token is expired or used")
   }
   const options = {
     httpOnly: true,
     secure: true
   }
   const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
   return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newRefreshToken, options)  
          .json(
           new ApiResponse(
               200,
               {accessToken, newRefreshToken},
               "Access token refreshed successfully"
           )
          )
 } catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh token")
 }
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}