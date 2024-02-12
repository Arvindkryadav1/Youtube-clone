import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400, "All fiels are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    const createdPlaylist = await Playlist.findById(playlist._id)
    if(!createdPlaylist){
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res 
            .status(200)
            .json(new ApiResponse(200, createdPlaylist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId?.trim()){
        throw new ApiError(400, "UserId is missing")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User id is invalid")
    }
    const playlists = await Playlist.find({
        owner: userId
    })
    if(!playlists){
        throw new ApiError(500, "Something went wrong while fetching user playlist")
    }

    return res 
              .status(200)
              .json(new ApiResponse(200, playlists, "User playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400, "Playlist id is required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(500, "Something went wrong while fetching playlist")
    }
    return res
              .status(200)
              .json(200, playlist, "Playlist fetched successfully")
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlist Id is invalid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found")
    }

    playlist.videos.push(video)
    //Save the updated playlist
    const updatedPlaylist = await Playlist.save({validateBeforeSave: false})
    if (!updatedPlaylist){
        throw new ApiError(400, "Something went wrong while adding video to the playlist")
    }
    return res
             .status(200)
             .json(200, updatePlaylist, "Playlist updated successfully")
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
   if(!isValidObjectId(playlistId)){
    throw new ApiError(400, "Playlist id is invalid")
   }
   if(!isValidObjectId(videoId)){
     throw new ApiError(400, "Video id is invalid")
   }
   const playlist = await Playlist.findById(playlistId)
   if(!playlist){
    throw new ApiError(400, "playlist not found")
   }
   const video = await Video.findById(videoId)
   if(!video){
    throw new ApiError(400, "Video not found")
   }
   playlist.videos.pull(video)
   //save the updated playlist

   const updatedPlaylist = await Playlist.save({validateBeforeSave: false})
   if(!updatedPlaylist){
    throw new ApiError(500, "Something went wrong while removing video from the playlist")
   }
   return res
            .status(200)
            .json(
                200, 
                updatePlaylist, 
                "video removed from playlist successfully"
                )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlist id is not valid")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(500, "Something went wrong while deleting the playlist")
    }

    return res
            .status(200)
            .json(200, {}, "Playlist deleted successfully")
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist Id is not valid")
    }
    if(!name || !description){
        throw new ApiError(400, "All fields are required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while updating the playlist")
    }
    return res
              .status(200)
              .json(200, updatedPlaylist, "Playlist updated successfully")
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}