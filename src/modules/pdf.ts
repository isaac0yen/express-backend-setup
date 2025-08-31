import { PDF_API, TEMP_PATH } from "../config/config";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import CloudinaryModule from './coundinary';
import { logger } from "./logger";
import { DateTime } from "luxon";

interface PDFGenerationOptions {
  html: string;
  format?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  publicId?: string;
}

interface PDFResponse {
  success: boolean;
  url?: string;
  error?: string;
}

const pdf = {
  /**
   * Generate PDF from HTML content and upload to Cloudinary
   * @param options - PDF generation options
   * @returns Promise<PDFResponse> - Contains Cloudinary URL
   */
  generatePDF: async (options: PDFGenerationOptions): Promise<PDFResponse> => {
    let tempFilePath: string | null = null;

    try {
      const { html, format = 'A4', filename = 'document.pdf', orientation = 'portrait', publicId } = options;

      // Generate PDF from API
      const response = await axios.post(`${PDF_API}/generate-pdf`, {
        html,
        format,
        filename,
        orientation
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      // Create temporary file
      const timestamp = DateTime.now();
      const tempFileName = `pdf_${timestamp}_${filename}`;
      tempFilePath = path.join(TEMP_PATH, tempFileName);

      // Ensure temp directory exists
      if (!fs.existsSync(TEMP_PATH)) {
        fs.mkdirSync(TEMP_PATH, { recursive: true });
      }

      // Write PDF buffer to temporary file
      fs.writeFileSync(tempFilePath, Buffer.from(response.data));

      // Upload to Cloudinary
      const uploadResult = await CloudinaryModule.uploadImage(tempFilePath, publicId);

      return {
        success: true,
        url: uploadResult.secure_url
      };
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : 'PDF generation or upload failed';

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.error('Error cleaning up temp file:', cleanupError);
        }
      }
    }
  }
};

export default pdf;