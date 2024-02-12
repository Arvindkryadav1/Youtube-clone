import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400, "Video id not found")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is not valid")
    }

    const existingLike = Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
                .status(200)
                .json(new ApiResponse(201), {}, "like removed successfully")
    }else {
        const like = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })

        const likedVideo = await Like.findById(like._id)
        if(!likedVideo){
            throw new ApiError(500, "Something went wrong while liking the video")
        }

        return res 
                .status(200)
                .json(new ApiResponse(201, likedVideo, "video liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "No comment id found")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id id not valid")
    }

    const existingLike = Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
                .status(200)
                .json(new ApiResponse(200), {}, "Comment like removed successfully")
    }else {
        const like =  await Like.create({
           comment: commentId,
           likedBy: req.user?._id
        })

        const likedComment = await Like.findById(like._id)
        if(!likedComment){
            throw new ApiError(500, "Something went wrong while liking the comment")
        }

        return res
                .status(200)
                .json(new ApiResponse(201, likedComment, "comment liked successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, "Tweet id not found")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet id is not valid")
    }

    const existingLike = Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
                .status(200)
                .json(new ApiResponse(200, {}, "Removed exist tweet like"))
    }else {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        const likedTweet = Like.findById(like._id)

        if(!likedTweet){
            throw new ApiError(500, "Something went wrong while liking the tweet")
        }

        return res
               .status(200)
               .json(new ApiResponse(200, likedTweet, "Tweet liked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            },
        },
        {
            $unwind: "$videos",
        },
        {
            $lookup: {
                from: "likes",
                localField: "videos._id",
                foreignField: "videos",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                _id: "$video._id",
                title: "$videos.title",
                description: "$videos.description",
                thumbnail: "$videos.thumbnail",
                videoFile: "$videos.videoFile",
                duration: "$videos.duration",
                videws: "$videos.views",
                owner: "$videos.owner",
                likesCount:"$likesCount",
            }
        }
    ])

    return res
              .status(200)
              .json(
                new ApiResponse(200, likedVideos, "liked videos successfully fetched")
              )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}