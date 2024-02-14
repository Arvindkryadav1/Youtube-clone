import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary} from "../utils/cloudinary.js"
import { extractPublicId } from "cloudinary-build-url"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    let videoQuery = {}

    if(query){
        videoQuery = {...videoQuery, title: new RegExp(query, "i")}
    }
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid user id")
        }

        videoQuery = {...videoQuery, owner: userId}
    }

    const totalVideos = await Video.countDocuments(videoQuery)
    let sortCriteria = {}
    if(sortBy){
        sortCriteria[sortBy] = sortType === "desc" ? -1 :1
    }
    const videos = await Video.find(videoQuery)
                              .sort(sortCriteria)
                              .skip((page-1)*limit)
                              .limit(Number(limit))
    return res
            .status(200)
            .json(200, videos, "Videos fetched successfully")
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400, "All fields are required")
    }
    // Uploading files on local server
    const videoLocalPath = req.files?.videoFile[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400, "Video localpath is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail local path is required")
    }

    //uploading files on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if(!videoFile){
        throw new ApiError(500, "Something went wrong while uploading video on cloudinary")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbanil on cloudinary")
    }

    //saving video in DB
    const video = await Video.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        duration: videoFile?.duration,
        owner: req.user._id
    })

    const uploadedVideo = await Video.findById(video._id)
    if(!uploadedVideo){
        throw new ApiError(500, "Something went while uploading video")
    }
    return res
    .status(201)
    .json(new ApiResponse(201, uploadedVideo, "Video Uploaded Successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is invalid")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(500, "Something went wrong while finding the video")
    }

    const user = await User.findById(req.user?._id)
    user.watchHistory.push(videoId)
    
    await user.save({
        validateBeforeSave: fasle
    })
    // increment of views count

    video.views =+ 1
    const view = await video.save({validateBeforeSave: false})
    if(!view){
        throw new ApiError(500, "Something went wrong while increasing the views")
    }

    return res.status(200).json(200, video, "Video fetched successfully")
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId?.trim()){
        throw new ApiError(400, "Video id is missing")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is invalid")
    }

    const {title, description} = req.body
    if(!title || !description){
        throw new ApiError(400, "All fields are required")
    }

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail local path is missing")
    }
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError(500, "Something went wrong while uploading on cloudinary")
    }

    //Deleting old

    const oldVideo = await Video.findById(videoId)
    const oldThumbnailURL = oldVideo.thumbnail
    if(!oldThumbnailURL){
        throw new ApiError(500, "Something went wrong while with thumbnail")
    }

    const thumbnailPublicId = extractPublicId(oldThumbnailURL)
    const deletedOldThumbnail = await deleteFromCloudinary(thumbnailPublicId)
    if(!deletedOldThumbnail){
        throw new ApiError(400, "Error while deleting old thumbnail from cloudinary")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail: thumbnail.url,
                title,
                description,
            },
        },
        {
            new: true
        }
    )
    return res
             .status(200)
             .json(200, video, "Video updated successfully")

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "Something went wrong while deleting the video")
    }
    // delete video from cloudinary
    const videoPublicId = extractPublicId(deletedVideo.videoFile)
    const videoFile = await deleteVideoFromCloudinary(videoPublicId)
    if(!videoFile){
        500, "Something went wrong while deleting video from cloudinary"
    }
    // deleting thumbnail from cloudinary
    const tpid = extractPublicId(deletedVideo.thumbnail)
    const thumbnailFile = await deleteFromCloudinary(tpid)
    if(!thumbnailFile){
        throw new ApiError(500, " Something went wrong while deleting thumbnail from cloudinary")
    }
    return res
           .status(200)
           .json(200, {}, "Video deleted successfully")
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "No video id found")
    }
    if(isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is not valid")
    }

    const video = await Video.findById(videoId)
    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(200, {}, "Toggle Publish status successfully")
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}