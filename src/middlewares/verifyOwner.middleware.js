import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Video } from "../models/video.models"
import { Tweet } from "../models/tweet.models"
import { Playlist } from "../models/playlist.models"
import { Comment } from "../models/comment.models"

const verifyIsOwnerForVideo = asyncHandler(async(req, res, next) => {
    try {
        const { videoId } = req.params
        if(!videoId){
            throw new ApiError(400, "Video id not found")
        }
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(400, "Video not found")
        }
        if(video.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "You are not the owner of this video")
        }
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Video not found")
    }
})

const verifyIsOwnerForTweet = asyncHandler(async(req, res, next) => {
    try {
        const { tweetId } = req.params
        if(!tweetId){
            throw new ApiError(401, "Tweet id not found")
        }
        const tweet = await Tweet.findById(tweetId)
        if(!tweet){
            throw new ApiError(401, "Tweet Not found")
        }

        if(tweet.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "You are not the owner of this tweet")
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Tweet not found")
    }
})

const verifyIsOwnerForPlaylist = asyncHandler(async(req, res, next) => {
    try {
        const { playlistId } = req.params
        if(!playlistId){
            throw new ApiError(401, "Playlist not found")
        }

        const playlist = await Playlist.findById(playlistId)
        if(playlist.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "You are not the owner of this playlist")
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Playlist not found")
    }
})

const verifyIsOwnerForComment = asyncHandler(async(req, res, next) =>{
    try {
        const {commentId} = req.params
        if(!commentId){
            throw new ApiError(401, "Comment not found")
        }
        const comment = await Comment.findById(commentId)
        if(comment.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "You are not the owner of this comment")
        }
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Comment not found")
    }
})
export { 
    verifyIsOwnerForVideo, 
    verifyIsOwnerForTweet, 
    verifyIsOwnerForComment, 
    verifyIsOwnerForPlaylist 
};