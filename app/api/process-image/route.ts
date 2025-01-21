"use server";

import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import OpenAI from "openai";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse Google Cloud credentials from environment variable
const googleCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}");

// Initialize Vision client using parsed credentials
const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: googleCredentials.client_email,
    private_key: googleCredentials.private_key,
  },
});

async function saveBlogPost(userId: string, title: string, content: string) {
  const sql = await getDbConnection();
  const [insertedPost] = await sql`
    INSERT INTO posts (user_id, title, content)
    VALUES (${userId}, ${title}, ${content})
    RETURNING id
  `;
  return insertedPost.id;
}

async function saveQuiz(postId: string, quizzes: any[]) {
  const sql = await getDbConnection();
  for (const quiz of quizzes) {
    await sql`
      INSERT INTO quizzes (post_id, question, options, correct_answer, difficulty)
      VALUES (${postId}, ${quiz.question}, ${JSON.stringify(quiz.options)}, ${quiz.correctAnswer}, ${quiz.difficulty})
    `;
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
    }

    // Use the initialized client to detect text
    const [textResult] = await client.textDetection(image);
    const detectedText = textResult.fullTextAnnotation?.text || "";

    if (!detectedText) {
      return NextResponse.json({ error: "No text detected." }, { status: 400 });
    }

    const prompt = `
      The following text was extracted from an image:
      "${detectedText}"
      
      Generate a quiz in JSON format:
      [
        { "question": "What is the main idea?", "options": ["Option 1", "Option 2"], "correctAnswer": "Option 1", "difficulty": 2 }
      ]
    `;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    let quizzes = [];
    try {
      quizzes = JSON.parse(chatResponse.choices[0]?.message?.content || "[]");
    } catch (error) {
      console.error("Error parsing quiz data:", error);
      return NextResponse.json({ error: "Failed to parse quiz data." }, { status: 500 });
    }

    const postId = await saveBlogPost(clerkUser.id, "Generated Quiz", JSON.stringify(quizzes));
    await saveQuiz(postId, quizzes);

    return NextResponse.json({ 
      success: true, 
      postId,
      detectedText, // Include detected text in response for debugging
      quizzes 
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
    }
    const userId = clerkUser.id;

    const sql = await getDbConnection();

    // Fetch quizzes joined with posts for the user
    const quizzes = await sql`
      SELECT q.id, q.question, q.options, q.correct_answer, q.difficulty, p.title
      FROM quizzes q
      JOIN posts p ON q.post_id = p.id
      WHERE p.user_id = ${userId}
      ORDER BY q.created_at DESC;
    `;

    return NextResponse.json({ quizzes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}