"use client";

import { useState, useEffect } from "react";
import { CldImage } from "next-cloudinary";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export default function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [responseJson, setResponseJson] = useState<Record<string, unknown> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
        toast.error(error.message || "Failed to load quizzes.");
      }
    }
  };

  useEffect(() => {
    fetchLatestQuizzes();
  }, []);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.info("File selected! Ready for upload.");
    } else {
      toast.error("Please select an image file.");
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected. Please select a file before uploading.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      if (!reader.result) {
        toast.error("Failed to read the file.");
        return;
      }

      toast.info("Uploading image, please wait...");

      try {
        const response = await fetch("/api/image-upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload image.");
        }

        const data = await response.json();
        setUploadedImageUrl(data.url);
        toast.success("Image uploaded successfully!");

        handleOcrProcessing(data.url);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error uploading image:", error);
          toast.error("An error occurred during upload.");
        }
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the file.");
    };
  };

  const handleOcrProcessing = async (imageUrl: string) => {
    setIsProcessing(true);
    setResponseJson(null);
    toast.info("Processing image, this may take a moment...");

    try {
      const response = await fetch("/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process the image.");
      }

      const data = await response.json();
      setResponseJson(data);
      toast.success("Image processed successfully!");
      fetchLatestQuizzes();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error processing image:", error);
        toast.error(error.message || "An error occurred while processing the image.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <h1>Image Upload and Quiz Display</h1>

      <input type="file" accept="image/*" onChange={handleFileSelection} className="upload-input" />
      <button onClick={handleImageUpload} className="upload-button" disabled={!selectedFile || isProcessing}>
        {isProcessing ? "Processing..." : "Upload"}
      </button>

      {uploadedImageUrl && (
        <div className="uploaded-image">
          <h2>Uploaded Image:</h2>
          <CldImage src={uploadedImageUrl} width="500" height="500" crop="fill" alt="Uploaded Image" />
        </div>
      )}

      {responseJson && (
        <div className="response-json">
          <h2>Response (JSON Format):</h2>
          <pre>{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
      )}

      {quizzes.length > 0 && (
        <div className="fetched-quizzes">
          <h2>Latest Uploaded Quiz:</h2>
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
