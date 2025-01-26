// "use server";

// import { v2 as cloudinary } from "cloudinary";
// import { Readable } from "stream";

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /**
//  * Uploads a file to Cloudinary using a buffer.
//  * @param fileBuffer - The buffer of the file to upload.
//  * @param fileName - The name of the file to save on Cloudinary.
//  * @returns The secure URL of the uploaded file or null if an error occurs.
//  */
// export async function uploadToCloudinary(
//   fileBuffer: Buffer,
//   fileName: string
// ): Promise<string | null> {
//   try {
//     return new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { resource_type: "auto", public_id: fileName },
//         (error, result) => {
//           if (error) {
//             console.error("Error uploading to Cloudinary:", error);
//             reject(null);
//           } else if (result && result.secure_url) {
//             resolve(result.secure_url);
//           } else {
//             console.error("Cloudinary result is undefined");
//             reject(null);
//           }
//         }
//       );

//       // Convert the buffer to a readable stream and pipe it to the upload stream
//       const readableStream = Readable.from(fileBuffer);
//       readableStream.pipe(uploadStream);
//     });
//   } catch (error) {
//     console.error("Unexpected error during upload:", error);
//     return null;
//   }
// }
