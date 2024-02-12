import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId?.trim()){
        throw new ApiError(400, "Channel Id not found")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Channel id is not valid")
    }
    if(channelId.toString() === req.user._id.toString()){
        throw new ApiError(400, "You cant subscribe to yourself")
    }

    const existingSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })
    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id)
        return res
                  .status(200)
                  .json(200, {}, "unsubscribed Successfully")
    }else{
        await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })
    }
    const subscribedUser = await Subscription.findById(Subscription._id)

    if(!subscribedUser){
        throw new ApiError(500, "Something went wrong while subscribing")
    }
    return res
             .status(201)
             .json(201, subscribedUser, "channel subscribed successfully")
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId?.trim()){
        throw new ApiError(400, "No channel id found")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channel id is invalid")
    }

    const subscribers = await Subscription.findById({
        channel: channelId,
    })

    if(!subscribers){
        throw new ApiError(500, "Something went wrong while fetching subscribers")
    }

    return res
              .status(200)
              .json(200, subscribers, "Subscribers fetched successfully")
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(400, "subscriber id not found")
    }
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Subscribers Id is not valid")
    }

    const channels = await Subscription.find({
        subscriber: subscriberId
    })
    return res.status(200).json(200, channels, "channels fetched successfuly")
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}