import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define POST handler for image uploads
export async function POST(req: Request) {
  try {
    // Parse the incoming request
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid file provided." },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "uploads" },
      (error, result) => {
        if (error) {
          throw error;
        }
        return result;
      }
    );

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: "An error occurred during the upload." },
      { status: 500 }
    );
  }
}
