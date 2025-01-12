"use server";

import { NextRequest, NextResponse } from "next/server";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }
    const userId = clerkUser.id;

    const sql = await getDbConnection();

    // Fetch the latest post_id for the user
    const [latestPost] = await sql`
      SELECT id
      FROM posts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (!latestPost) {
      return NextResponse.json({ quizzes: [] }, { status: 200 }); // No posts available
    }

    const latestPostId = latestPost.id;

    // Fetch quizzes for the latest post
    const quizzes = await sql`
      SELECT q.id, q.question, q.options, q.correct_answer, q.difficulty
      FROM quizzes q
      WHERE q.post_id = ${latestPostId}
      ORDER BY q.created_at DESC;
    `;

    return NextResponse.json({ quizzes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
