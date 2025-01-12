"use server";

import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import OpenAI from "openai";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { Buffer } from "buffer";

// Load Google credentials from the environment
const googleCredentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
if (!googleCredentialsBase64) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS_BASE64 is not set in the environment variables.");
}

// Decode and parse the base64-encoded JSON credentials
const googleCredentials = JSON.parse(
  Buffer.from(googleCredentialsBase64, "base64").toString("utf8")
);

// Initialize the Vision API client with the decoded credentials
const visionClient = new vision.ImageAnnotatorClient({
  credentials: googleCredentials,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Save blog post in the database
async function saveBlogPost(userId: string, title: string, content: string) {
  const sql = await getDbConnection();
  const [insertedPost] = await sql`
    INSERT INTO posts (user_id, title, content)
    VALUES (${userId}, ${title}, ${content})
    RETURNING id
  `;
  return insertedPost.id;
}

// Save quiz in the database
async function saveQuiz(postId: string, quizzes: any[]) {
  const sql = await getDbConnection();
  for (const quiz of quizzes) {
    await sql`
      INSERT INTO quizzes (post_id, question, options, correct_answer, difficulty)
      VALUES (${postId}, ${quiz.question}, ${JSON.stringify(quiz.options)}, ${quiz.correctAnswer}, ${quiz.difficulty})
    `;
  }
}

// POST handler to process the image and generate a quiz
export async function POST(req: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) {
    return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
  }

  const { image } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }

  try {
    // Detect text in the image
    const [textResult] = await visionClient.textDetection(image);
    const detectedText = textResult.fullTextAnnotation?.text || "";

    if (!detectedText) {
      return NextResponse.json({ error: "No text detected." }, { status: 400 });
    }

    // Generate quiz based on the detected text
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
    } catch {
      return NextResponse.json({ error: "Failed to parse quiz data." }, { status: 500 });
    }

    // Save the generated quiz in the database
    const postId = await saveBlogPost(clerkUser.id, "Generated Quiz", JSON.stringify(quizzes));
    await saveQuiz(postId, quizzes);

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// GET handler to fetch quizzes for the authenticated user
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
