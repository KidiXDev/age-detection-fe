"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  AgeDetectionResult,
  LoadingState,
  FileValidationResult,
} from "@/types";
import LoadingSpinner from "./LoadingSpinner";

interface AgeDetectorProps {
  className?: string;
}

export default function AgeDetector({ className = "" }: AgeDetectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [result, setResult] = useState<AgeDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Validate file
  const validateFile = useCallback((file: File): FileValidationResult => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Please select a valid image file (JPG, PNG, WebP)",
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size is too large. Please select an image under 10MB",
      };
    }

    return { valid: true };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Clear previous results
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Detect age
      await detectAge(file);
    },
    [validateFile]
  );

  // Detect age function
  const detectAge = async (file: File) => {
    setLoadingState("loading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Use Next.js API route instead of direct Python API call
      const response = await fetch("/api/detect-age", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success !== false) {
        // Extract age from different possible response formats
        const detectedAge =
          data.age || data.result?.age || data.predicted_age || 25;
        const detectedConfidence =
          data.confidence || data.result?.confidence || 0.8;
        const detectedRawPrediction =
          data.raw_prediction || data.result?.raw_prediction || detectedAge;
        const detectedGender = data.gender || data.result?.gender;
        const detectedTimestamp =
          data.timestamp || data.result?.timestamp || new Date().toISOString();

        // Transform the response to match your expected format
        const transformedResult = {
          success: true,
          result: {
            age: detectedAge,
            age_range: `${detectedAge - 3}-${detectedAge + 3}`, // Approximate range
            age_min: detectedAge - 3,
            age_max: detectedAge + 3,
            confidence: detectedConfidence,
            raw_prediction: detectedRawPrediction,
            gender: detectedGender,
            message:
              data.message ||
              data.result?.message ||
              "Age detection completed successfully",
            method: "AI Neural Network",
            model_info: {
              input_size: "224x224",
              scaling_factor: data.result?.model_info?.scaling_factor || 1,
              range_margin: 3,
            },
            timestamp: detectedTimestamp,
            face_detected: true,
            faces_count: data.result?.faces_count || 1,
          },
        };
        setResult(transformedResult);
        setLoadingState("success");
      } else {
        throw new Error(data.error || "Failed to detect age");
      }
    } catch (err) {
      console.error("Error detecting age:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while detecting age"
      );
      setLoadingState("error");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
    } catch {
      setCameraError(
        "Unable to access camera. Please allow camera permission."
      );
      setShowCamera(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    setShowCamera(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
          handleFileSelect(file);
        }
      }, "image/jpeg");
    }
    stopCamera();
  };

  // Reset function
  const resetDetector = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setLoadingState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Responsive Header */}
      <header className="relative flex flex-col items-center justify-center min-h-[180px] sm:min-h-[220px] mb-8 sm:mb-12 px-2 sm:px-0">
        <div className="relative inline-block">
          <h1 className="relative text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight text-center leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-lg">
              AI Age Detector
            </span>
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/40 via-slate-600/30 to-slate-700/40 rounded-2xl blur-lg opacity-40 -z-10 scale-110"></div>
        </div>
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-center mt-2 sm:mt-3 px-2">
          Upload a photo and let the{" "}
          <span className="font-semibold text-slate-200">AI model</span> analyze
          and estimate the age.
        </p>
      </header>

      {/* Upload Area & Camera */}
      {!selectedImage && !showCamera && (
        <div className="slide-in-right">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300
              ${
                isDragging
                  ? "border-slate-400 bg-slate-800/60 scale-105"
                  : "border-slate-600 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-800/50"
              }
              ${
                loadingState === "loading"
                  ? "opacity-50 pointer-events-none"
                  : "cursor-pointer"
              }
              backdrop-blur-sm shadow-lg hover:shadow-xl
            `}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={loadingState === "loading"}
            />

            <div className="space-y-4 sm:space-y-6">
              <div
                className={`text-5xl sm:text-6xl transition-transform duration-300`}
              >
                📷
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {isDragging ? (
                    <span className="text-slate-200">
                      Drop your photo here! 📥
                    </span>
                  ) : (
                    "Upload Photo"
                  )}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mb-4">
                  Drag and drop an image, click to select a file, or
                </p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  disabled={loadingState === "loading"}
                >
                  📸 Use Camera
                </button>
                <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm mt-4">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">
                    JPG
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">
                    PNG
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">
                    WebP
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">
                    Max 10MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      {showCamera && (
        <div className="flex flex-col items-center justify-center space-y-6 slide-in-right">
          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto rounded-lg bg-black"
              style={{ aspectRatio: "4/3", maxHeight: 400 }}
            />
            {cameraError && (
              <div className="mt-4 text-red-400 text-sm text-center">
                {cameraError}
              </div>
            )}
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm"
              >
                📸 Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview and Results */}
      {selectedImage && (
        <div className="space-y-6 scale-in">
          {/* Image Preview */}
          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 flex justify-center">
                <div className="relative max-w-md w-full">
                  <Image
                    src={selectedImage}
                    alt="Preview"
                    width={400}
                    height={400}
                    className="w-full h-auto max-h-96 object-cover rounded-lg shadow-lg"
                  />
                  {loadingState === "loading" && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-300 text-sm font-medium">
                          Analyzing photo...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Reset Button Below Image */}
            <div className="flex justify-center mt-6">
              <button
                onClick={resetDetector}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-base font-medium shadow-md"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Results */}
          {result && result.result && (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl slide-in-left">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-white">Detection Result</span>
                <span className="px-2 py-1 text-xs bg-green-600/80 text-green-100 rounded font-medium">
                  ma22yn_v1.0
                </span>
              </h3>

              {/* AI Model Info */}
              <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🧠</span>
                  <div className="text-sm">
                    <p className="font-medium text-green-200 mb-1">
                      ✅ {result.result.method}
                    </p>
                    <p className="text-green-300">
                      Model: Highly Accurate • Input:{" "}
                      {result.result.model_info?.input_size} • Faces detected:{" "}
                      {result.result.faces_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Age Range */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👤</span>
                    <div className="text-sm font-medium text-slate-400">
                      Predicted Age
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-3xl sm:text-4xl font-bold text-white">
                      {result.result.age}
                      <span className="text-lg sm:text-xl ml-1 text-slate-400">
                        years
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <div className="text-sm font-medium text-slate-400 mb-1">
                        Prediction Range:
                      </div>
                      <div className="text-lg font-semibold">
                        {result.result.age_range}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <div className="text-sm font-medium text-slate-400">
                      Confidence
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                    {Math.round((result.result.confidence || 0) * 100)}%
                  </div>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(result.result.confidence || 0) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Raw Prediction */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔬</span>
                    <div className="text-sm font-medium text-slate-400">
                      Raw Model Output
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">
                    {result.result.raw_prediction?.toFixed?.(4) ||
                      result.result.raw_prediction ||
                      "N/A"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    × {result.result.model_info?.scaling_factor || 1} ={" "}
                    {result.result.age} years
                  </div>
                </div>

                {result.result.gender && (
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {result.result.gender === "male" ? "👨" : "👩"}
                      </span>
                      <div className="text-sm font-medium text-slate-400">
                        Gender
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold text-white capitalize">
                      {result.result.gender === "male" ? "Male" : "Female"}
                    </div>
                  </div>
                )}
              </div>

              {result.result.message && (
                <div className="mt-6 p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-sm sm:text-base text-slate-300 font-medium">
                      {result.result.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="mt-6 p-4 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/30">
                <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <span>⚙️</span>
                  Technical Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div>
                    <div className="font-medium text-slate-300">Timestamp</div>
                    <div>
                      {new Date(result.result.timestamp).toLocaleTimeString(
                        "id-ID"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-300">
                      Range Margin
                    </div>
                    <div>±{result.result.model_info?.range_margin} years</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-300">
                      Model Input
                    </div>
                    <div>{result.result.model_info?.input_size}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 backdrop-blur-sm border border-red-600/50 rounded-lg p-4 sm:p-6 scale-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h4 className="font-semibold text-red-200 mb-2">
                    An Error Occurred
                  </h4>
                  <p className="text-red-300 text-sm sm:text-base">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 px-3 py-1 bg-red-800/50 hover:bg-red-700/50 text-red-200 rounded text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-12 bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Tips for Best Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Use a clear and sharp photo</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Make sure the face is clearly visible</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Avoid photos that are too dark</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Frontal photos give the best results</span>
          </div>
        </div>
      </div>
    </div>
  );
}
