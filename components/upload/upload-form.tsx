"use client";

import { useState, useEffect } from "react";
import { CldImage } from "next-cloudinary";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [responseJson, setResponseJson] = useState<any>(null); // For raw JSON response
  const [isProcessing, setIsProcessing] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]); // Latest fetched quizzes

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
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast.error(error.message || "Failed to load quizzes.");
    }
  };

  // Fetch quizzes on component mount
  useEffect(() => {
    fetchLatestQuizzes();
  }, []);

  // Handle file selection
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.info("File selected! Ready for upload.");
    } else {
      toast.error("Please select an image file.");
    }
  };

  // Upload image to Cloudinary
  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected. Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    toast.info("Uploading image, please wait...");
    try {
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
      setUploadedImageUrl(secureUrl);
      toast.success("Image uploaded successfully!");

      // Send the image URL to the backend for OCR and quiz generation
      handleOcrProcessing(secureUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("An error occurred during upload.");
    }
  };

  // Process image for OCR and quiz generation
  const handleOcrProcessing = async (imageUrl: string) => {
    setIsProcessing(true);
    setResponseJson(null); // Reset response before processing
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
      setResponseJson(data); // Store raw JSON response
      toast.success("Image processed successfully!");
      fetchLatestQuizzes(); // Refresh quizzes after processing
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.error(error.message || "An error occurred while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <h1>Image Upload and Quiz Display</h1>

      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelection}
        className="upload-input"
      />

      {/* Upload Button */}
      <button
        onClick={handleImageUpload}
        className="upload-button"
        disabled={!selectedFile || isProcessing}
      >
        {isProcessing ? "Processing..." : "Upload"}
      </button>

      {/* Display Uploaded Image */}
      {uploadedImageUrl && (
        <div className="uploaded-image">
          <h2>Uploaded Image:</h2>
          <CldImage
            src={uploadedImageUrl}
            width="500"
            height="500"
            crop="fill"
            alt="Uploaded Image"
          />
        </div>
      )}

      {/* Display JSON Response */}
      {responseJson && (
        <div className="response-json">
          <h2>Response (JSON Format):</h2>
          <pre>{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
      )}

      {/* Display Latest Fetched Quizzes */}
      {quizzes.length > 0 && (
        <div className="fetched-quizzes">
          <h2>Latest Uploaded Quiz:</h2>
          <ul>
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <h3>{quiz.question}</h3>
                <ul>
                  {quiz.options.map((option: string, index: number) => (
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
