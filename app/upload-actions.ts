"use server";
import getDbConnection from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import OpenAI from "openai";
import { currentUser } from "@clerk/nextjs/server";

const clerkUser = await currentUser();
const userId = clerkUser?.id;
 
async function saveBlogPost(userId: string,content: string) {
  try {
    const sql = await getDbConnection();

    const [insertedPost] = await sql`
    INSERT INTO posts (user_id, content)
    VALUES (${userId}, ${content})
    RETURNING id
    `;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post", error);
    throw error;
  }
}

async function getUserBlogPosts(userId: string) {
  try {
    const sql = await getDbConnection();
    const posts = await sql`
    SELECT content FROM posts 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC 
    LIMIT 3
  `;
    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error getting user blog posts", error);
    throw error;
  }
}

