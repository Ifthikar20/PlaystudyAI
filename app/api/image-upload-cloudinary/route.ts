// import { v2 as cloudinary } from "cloudinary";
// import { NextResponse } from "next/server";

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Define POST handler for image uploads
// export async function POST(req: Request) {
//   try {
//     // Parse the incoming request
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file || !(file instanceof Blob)) {
//       return NextResponse.json(
//         { error: "Invalid file provided." },
//         { status: 400 }
//       );
//     }

//     // Convert Blob to Buffer
   

//     // Upload to Cloudinary
//     const uploadResult = await cloudinary.uploader.upload_stream(
//       { resource_type: "auto", folder: "uploads" },
//       (error, result) => {
//         if (error) {
//           throw error;
//         }
//         return result;
//       }
//     );

//     return NextResponse.json(uploadResult);
//   } catch (error) {
//     console.error("Error uploading to Cloudinary:", error);
//     return NextResponse.json(
//       { error: "An error occurred during the upload." },
//       { status: 500 }
//     );
//   }
// }

"use server";


import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

// Upload image to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No file selected. Please select a file before uploading." }, { status: 400 });
    }

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

    console.info("Uploading image, please wait...");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload image.");
    }

    const data = await response.json();
    const secureUrl = data.secure_url;

    console.info("Image uploaded successfully!");

    return NextResponse.json({ url: secureUrl }, { status: 200 });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "An error occurred during upload." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
