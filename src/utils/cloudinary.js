import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        console.log("response");
        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation failed
        return null;
    }
}

const deleteFromCloudinary = async(publicId) => {
    try {
        if(!publicId) return null
        const deletionResult = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image"
        })
        return deletionResult;
    } catch (error) {
        console.log("Error while deleting from cloudinary", error)
        return null
    }
}

const deleteVideoFromCloudinary = async(publicId){
    try {
        if(!publicId) return null;
        const videoDeletionResult = await cloudinary.uploader.destroy(publicId, {
            resource_type: "Video"
        })
    } catch (error) {
        console.log("Error while deleting video from cloudinary", error)
        return null
    }
}



export {uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary}