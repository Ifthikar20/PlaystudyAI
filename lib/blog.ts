import getDbConnection from "./db";

/**
 * Save a blog post to the database.
 * @param userId - The ID of the user creating the post.
 * @param title - The title of the blog post.
 * @param content - The content of the blog post.
 * @returns The ID of the inserted post.
 */
export async function saveBlogPost(userId: string, title: string, content: string): Promise<number> {
  try {
    const sql = await getDbConnection();
    const [insertedPost] = await sql`
      INSERT INTO posts (user_id, title, content)
      VALUES (${userId}, ${title}, ${content})
      RETURNING id;
    `;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post:", error);
    throw error;
  }
}

/**
 * Get recent blog posts by a user.
 * @param userId - The ID of the user.
 * @returns A string concatenating the content of the most recent posts.
 */
export async function getUserBlogPosts(userId: string): Promise<string> {
  try {
    const sql = await getDbConnection();
    const posts = await sql`
      SELECT content FROM posts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 3;
    `;
    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error fetching user blog posts:", error);
    throw error;
  }
}
