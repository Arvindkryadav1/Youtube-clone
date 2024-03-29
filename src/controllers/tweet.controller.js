import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400, "User Id not found")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User Id is not valid")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    const postedTweet = await Tweet.findById(tweet._id)
    if(!postedTweet){
        throw new ApiError(500, "Something went wrong while posting the tweet")
    }

    return res
             .status(200)
             .json(200, postedTweet, "Tweet posted successfully")

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400, "No user id found")
    }
    if(isValidObjectId(userId)){
        throw new ApiError(400, "User id is invalid")
    }
    const tweets = Tweet.find({
        owner: userId
    })
    if(!tweets){
        throw new ApiError(400, "something went wrong while getting tweets")
    }
    return res.status(200).json(200, tweets, "Tweets fetched successfully")
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    if(!tweetId?.trim()){
        throw new ApiError(400, "Tweet id is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet id is invalid")
    }
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }
    await Tweet.findOne({_id:tweetId})
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            },
        },
        {
            new: true
        }
    )
    if(!updatedTweet){
        throw new ApiError(500, "Something went wrong while updating the tweet")
    }
    return res.status(200).json(200, updatedTweet, "Tweet updated successfully")

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "Tweet Id is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet id is invalid")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
     throw new ApiError(500, "Something went wrong while deleting the tweet")
    }
    return res
            .status(200)
            .json(200, {}, "Tweet deleted successfully")
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}