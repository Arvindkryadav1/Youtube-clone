import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId?.trim()){
        throw new ApiError(400, "Video id is missing")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is not valid")
    }

    const comments = await Comment.find({videoId})
                                  .skip((page-1)*limit)
                                  .limit(limit)
    return res
            .status(200)
            .json(new ApiResponse, comments, "Comments fetched successfully")
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    if(!videoId?.trim()){
        throw new ApiError(400, "Video id is missing")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video id is not valid")
    }
    const { content } = req.body
    if(!content){
        throw new ApiError(400, "Comment is missing")
    }
    //Saving comment in database
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    const createdComment = await Comment.findById(comment._id)
    if(!createdComment){
        throw new ApiError(500, "Something went wrong while saving comment in database")
    }

    return res
           .status(200)
           .json(new ApiResponse(201, createdComment, "comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    if(!commentId?.trim()){
       throw new ApiError(400, "commentId is missing")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id is not valid")
    }

    const { content } = req.body;
    if(!content){
        throw new ApiError(400, "Comment is required")
    }

    await Comment.findOne({_id: commentId})
    const updatedComment = Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
               content,
            },
        },
        {
            new: true
        }
    )
    if(!updatedComment){
        throw new ApiError(500, "Something went wrong while updating comment")
    }

    return res
           .status(200)
           .json(201, "Comment updated successfully")
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if(!commentId){
        throw new ApiError(400, "Comment id is missing")
    } 
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id is not valid")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(500, "Something went wrong while deleting the comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(201, {}, "Comment deleted Successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }