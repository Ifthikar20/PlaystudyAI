"use client";

import { useState, useEffect } from "react";
// import { CldImage } from "next-cloudinary";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export default function UploadForm() {
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  // const [responseJson, setResponseJson] = useState<Record<string, unknown> | null>(null);
  // const [isProcessing, setIsProcessing] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Fetch the latest quizzes for the authenticated user
  const fetchLatestQuizzes = async () => {
    try {
      const response = await fetch("/api/get-quizzes", { method: "GET" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch quizzes.");
      }
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching quizzes:", error);
        // toast.error(error.message || "Failed to load quizzes.");
      }
    }
  };

  useEffect(() => {
    fetchLatestQuizzes();
  }, []);

  return (
    <div className="container">
      {/* <ToastContainer /> */}
      <h1>Latest Uploaded Quiz</h1>

      {quizzes.length > 0 && (
        <div className="fetched-quizzes">
          <ul>
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <h3>{quiz.question}</h3>
                <ul>
                  {quiz.options.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
                <p>
                  <strong>Correct Answer:</strong> {quiz.correct_answer}
                </p>
                <p>
                  <strong>Difficulty:</strong> {quiz.difficulty}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
