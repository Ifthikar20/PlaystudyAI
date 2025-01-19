// "use server";

// import getDbConnection from "@/lib/db";
// import OpenAI from "openai";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// async function saveBlogPost(userId: string, title: string, content: string) {
//   try {
//     const sql = await getDbConnection();
//     const [insertedPost] = await sql`
//     INSERT INTO posts (user_id, title, content)
//     VALUES (${userId}, ${title}, ${content})
//     RETURNING id
//     `;
//     return insertedPost.id;
//   } catch (error) {
//     console.error("Error saving blog post", error);
//     throw error;
//   }
// }

// // export async function performOCR(imageUrl: string) {
// //   if (!imageUrl) {
// //     console.error("Image URL is required");
// //     return;
// //   }

// //   try {
// //     console.log("Starting OCR for image:", imageUrl);

// //     // Perform OCR using Tesseract.js
// //     const result = await Tesseract.recognize(imageUrl, "eng", {
// //       logger: (info) => console.log(info), // Logs OCR progress
// //     });

// //     const extractedText = result.data.text;
// //     console.log("Extracted Text:", extractedText);
// //     return extractedText;
// //   } catch (error) {
// //     console.error("Error performing OCR:", error);
// //     throw error;
// //   }
// // }

// export async function getUserBlogPosts(userId: string) {
//   try {
//     const sql = await getDbConnection();
//     const posts = await sql`
//     SELECT content FROM posts 
//     WHERE user_id = ${userId} 
//     ORDER BY created_at DESC 
//     LIMIT 3
//   `;
//     return posts.map((post) => post.content).join("\n\n");
//   } catch (error) {
//     console.error("Error getting user blog posts", error);
//     throw error;
//   }
// }


