import { AuthenticatedRequest } from "../middlewares/auth";
import CloudinaryModule from "../modules/coundinary";
import { db } from "../modules/database";
import { Response } from "express";
import fs from "fs";
import path from "path";
import { TEMP_PATH } from "../config/config";

export default {
  updateProfilePicture: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.context!;
      const { base64string, fileName } = req.body;

      if (!base64string || !fileName) {
        return res.status(400).json({ message: "Image buffer and file name are required" });
      }

      const tempFilePath = path.join(TEMP_PATH, fileName);
      
      if (!fs.existsSync(TEMP_PATH)) {
        fs.mkdirSync(TEMP_PATH, { recursive: true });
      }

      const cleanBase64 = base64string.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, "base64");
      fs.writeFileSync(tempFilePath, buffer);

      const uploadResult = await CloudinaryModule.uploadImage(tempFilePath, `user_${id}_profile`);

      fs.unlinkSync(tempFilePath);

      if (!uploadResult || !uploadResult.secure_url) {
        return res.status(500).json({ message: "Error uploading profile picture" });
      }

      const updatedRows = await db.updateOne('users', { profile_image: uploadResult.secure_url }, { id });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: true,
        message: "Profile picture updated successfully",
        data: { profile_image: uploadResult.secure_url }
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ message: "Error updating profile picture" });
    }
  }};