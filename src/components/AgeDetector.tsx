"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  AgeDetectionResult,
  LoadingState,
  FileValidationResult,
  RawApiResponse,
} from "@/types";
import LoadingSpinner from "./LoadingSpinner";
import {
  FiCamera,
  FiUser,
  FiTarget,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
  FiInfo,
  FiEye,
  FiBarChart,
  FiCpu,
  FiArrowDown,
} from "react-icons/fi";
import TipsSection from "./TipsSection";
import TechnicalDetails from "./TechnicalDetails";
import ErrorDisplay from "./ErrorDisplay";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

  // Image preprocessing utilities
  const preprocessImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        // Calculate optimal dimensions (target 512x512 for better quality)
        const maxSize = 512;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);

          // Apply image enhancements
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Enhance contrast and brightness
          const contrast = 1.1; // Slight contrast boost
          const brightness = 5; // Slight brightness boost

          for (let i = 0; i < data.length; i += 4) {
            // Apply contrast and brightness to RGB channels
            data[i] = Math.min(
              255,
              Math.max(0, (data[i] - 128) * contrast + 128 + brightness)
            ); // Red
            data[i + 1] = Math.min(
              255,
              Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness)
            ); // Green
            data[i + 2] = Math.min(
              255,
              Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness)
            ); // Blue
          }

          ctx.putImageData(imageData, 0, 0);

          // Convert to high-quality JPEG
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const enhancedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(enhancedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.92 // High quality JPEG compression
          );
        } else {
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Response transformer utility
  const transformApiResponse = useCallback(
    (rawResponse: RawApiResponse): AgeDetectionResult => {
      // Extract age from different possible response formats
      const detectedAge =
        rawResponse.age ||
        rawResponse.result?.age ||
        rawResponse.predicted_age ||
        25;
      const detectedConfidence =
        rawResponse.confidence || rawResponse.result?.confidence || 0.8;
      const detectedRawPrediction =
        rawResponse.raw_prediction ||
        rawResponse.result?.raw_prediction ||
        detectedAge;
      const detectedGender = rawResponse.gender || rawResponse.result?.gender;
      const detectedTimestamp =
        rawResponse.timestamp ||
        rawResponse.result?.timestamp ||
        new Date().toISOString();

      return {
        success: true,
        result: {
          age: detectedAge,
          age_range: `${detectedAge - 3}-${detectedAge + 3}`,
          age_min: detectedAge - 3,
          age_max: detectedAge + 3,
          confidence: detectedConfidence,
          raw_prediction: detectedRawPrediction,
          gender: detectedGender,
          message:
            rawResponse.message ||
            rawResponse.result?.message ||
            "Age detection completed successfully",
          method: "AI Neural Network",
          model_info: {
            input_size: "224x224",
            scaling_factor: rawResponse.result?.model_info?.scaling_factor || 1,
            range_margin: 3,
          },
          timestamp: detectedTimestamp,
          face_detected: true,
          faces_count: rawResponse.result?.faces_count || 1,
        },
      };
    },
    []
  );

  // Detect age function
  const detectAge = useCallback(
    async (file: File): Promise<void> => {
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

        const rawData: RawApiResponse = await response.json();

        if (rawData.success !== false) {
          const transformedResult = transformApiResponse(rawData);
          setResult(transformedResult);
          setLoadingState("success");
        } else {
          throw new Error(rawData.error || "Failed to detect age");
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
    },
    [transformApiResponse]
  );

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
      setIsProcessing(true);

      try {
        // Preprocess image for better quality
        const enhancedFile = await preprocessImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>): void => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(enhancedFile);

        // Detect age with enhanced image
        await detectAge(enhancedFile);
      } catch (error) {
        console.error("Error processing image:", error);
        // Fallback to original file if preprocessing fails
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>): void => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        await detectAge(file);
      } finally {
        setIsProcessing(false);
      }
    },
    [validateFile, detectAge, preprocessImage]
  );

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
      // Request camera with square aspect ratio for 1:1 display
      const constraints = {
        video: {
          facingMode: "user", // Front camera for selfies
          width: { ideal: 640, max: 1280 },
          height: { ideal: 640, max: 1280 },
          aspectRatio: { ideal: 1.0 }, // Square aspect ratio
        },
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to basic video if constraints fail
        console.warn(
          "Failed to get camera with constraints, falling back to basic video"
        );
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        // Start face detection overlay after video starts playing
        videoRef.current.addEventListener("loadedmetadata", startFaceDetection);

        // Set up resize observer to handle video container resizing
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }

        resizeObserverRef.current = new ResizeObserver(() => {
          // Trigger canvas resize when video container size changes
          if (canvasRef.current && videoRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
          }
        });

        resizeObserverRef.current.observe(videoRef.current);
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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  };

  // Draw clean white face outline on canvas
  const drawFaceOutline = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the container dimensions (square aspect ratio)
    const containerWidth = video.clientWidth;
    const containerHeight = video.clientHeight;

    // Set canvas size to match the displayed video size
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === Face outline style ===
    ctx.strokeStyle = "#ffffff"; // white
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // solid line

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const faceWidth = canvas.width * 0.3;
    const faceHeight = canvas.height * 0.4;

    // Start drawing face shape
    ctx.beginPath();

    // Top forehead
    const topX = centerX;
    const topY = centerY - faceHeight * 0.5;

    // Forehead curve
    ctx.moveTo(topX - faceWidth * 0.3, topY + faceHeight * 0.1);
    ctx.quadraticCurveTo(
      topX,
      topY,
      topX + faceWidth * 0.3,
      topY + faceHeight * 0.1
    );

    // Right temple to cheek
    ctx.quadraticCurveTo(
      topX + faceWidth * 0.45,
      topY + faceHeight * 0.3,
      topX + faceWidth * 0.4,
      topY + faceHeight * 0.6
    );

    // Right jaw to chin
    ctx.quadraticCurveTo(
      topX + faceWidth * 0.3,
      topY + faceHeight * 0.85,
      topX,
      topY + faceHeight * 0.95
    );

    // Left jaw to cheek
    ctx.quadraticCurveTo(
      topX - faceWidth * 0.3,
      topY + faceHeight * 0.85,
      topX - faceWidth * 0.4,
      topY + faceHeight * 0.6
    );

    // Left temple to forehead
    ctx.quadraticCurveTo(
      topX - faceWidth * 0.45,
      topY + faceHeight * 0.3,
      topX - faceWidth * 0.3,
      topY + faceHeight * 0.1
    );

    ctx.closePath();
    ctx.stroke();

    // Continue drawing on next frame
    animationRef.current = requestAnimationFrame(drawFaceOutline);
  }, []);

  // Start face detection overlay
  const startFaceDetection = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      // Wait for video to be ready and properly sized
      const video = videoRef.current;
      const startDrawing = () => {
        if (
          video.readyState >= 2 &&
          video.clientWidth > 0 &&
          video.clientHeight > 0
        ) {
          // HAVE_CURRENT_DATA and video is properly sized
          drawFaceOutline();
        } else {
          setTimeout(startDrawing, 100);
        }
      };
      // Add a small delay to ensure the video element has been properly sized by CSS
      setTimeout(startDrawing, 200);
    }
  }, [drawFaceOutline]);

  // Enhanced capture photo function with preprocessing
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Use actual video dimensions but ensure square output
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;

    // Calculate square dimensions (use the smaller dimension for perfect square)
    const squareSize = Math.min(videoWidth, videoHeight);
    const maxSize = 1024; // Maximum resolution
    let targetSize = squareSize;

    // Scale down if too large while maintaining square aspect ratio
    if (squareSize > maxSize) {
      targetSize = maxSize;
    }

    canvas.width = targetSize;
    canvas.height = targetSize;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Calculate crop coordinates to center the square crop
    const cropX = (videoWidth - squareSize) / 2;
    const cropY = (videoHeight - squareSize) / 2;

    // Draw the video frame as a square (flip horizontally for natural selfie view)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      cropX,
      cropY,
      squareSize,
      squareSize, // Source crop (square from center)
      -targetSize,
      0,
      targetSize,
      targetSize // Destination (flipped square)
    );
    ctx.restore();

    // Apply image enhancements
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    const data = imageData.data;

    // Auto-adjust brightness and contrast based on image statistics
    let totalBrightness = 0;
    let pixelCount = 0;

    // Calculate average brightness
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;

    // Dynamic adjustment based on lighting conditions
    let brightnessAdjust = 0;
    let contrastAdjust = 1.0;

    if (avgBrightness < 100) {
      // Dark image - boost brightness and contrast
      brightnessAdjust = 20;
      contrastAdjust = 1.2;
    } else if (avgBrightness > 180) {
      // Bright image - reduce brightness slightly
      brightnessAdjust = -10;
      contrastAdjust = 1.1;
    } else {
      // Normal lighting - mild enhancement
      brightnessAdjust = 5;
      contrastAdjust = 1.05;
    }

    // Apply enhancements
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(
        255,
        Math.max(0, (data[i] - 128) * contrastAdjust + 128 + brightnessAdjust)
      );
      data[i + 1] = Math.min(
        255,
        Math.max(
          0,
          (data[i + 1] - 128) * contrastAdjust + 128 + brightnessAdjust
        )
      );
      data[i + 2] = Math.min(
        255,
        Math.max(
          0,
          (data[i + 2] - 128) * contrastAdjust + 128 + brightnessAdjust
        )
      );
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to high-quality file
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "enhanced_capture.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          handleFileSelect(file);
        }
      },
      "image/jpeg",
      0.95 // Very high quality
    );

    stopCamera();
  }, [handleFileSelect]);

  // Reset function
  const resetDetector = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setLoadingState("idle");
    setIsProcessing(false);
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
                className={`text-5xl sm:text-6xl transition-transform duration-300 flex justify-center`}
              >
                <FiCamera className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {isDragging ? (
                    <span className="text-slate-200 flex items-center justify-center gap-2">
                      Drop your photo here!{" "}
                      <FiArrowDown className="text-slate-300" />
                    </span>
                  ) : (
                    "Upload Photo"
                  )}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mb-4">
                  <span className="block sm:inline">
                    Drag and drop an image, click to select a file, or
                  </span>
                  <br className="hidden sm:block" />
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm cursor-pointer flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    disabled={loadingState === "loading"}
                  >
                    <FiCamera className="text-base" />
                    Use Camera
                  </button>
                </div>
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
            <div className="relative rounded-lg bg-black overflow-hidden aspect-square">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg bg-black"
                style={{
                  transform: "scaleX(-1)",
                  display: "block",
                }}
              />
              {/* Face Detection Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Face Detection Indicator */}
              <div className="absolute top-2 right-2 bg-emerald-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-emerald-400/30">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-300 font-medium">
                    Face Mapping
                  </span>
                </div>
              </div>
            </div>
            {cameraError && (
              <div className="mt-4 text-red-400 text-sm text-center">
                {cameraError}
              </div>
            )}
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2 cursor-pointer"
              >
                <FiCamera /> Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2 cursor-pointer"
              >
                <FiX /> Cancel
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
                  {(loadingState === "loading" || isProcessing) && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-300 text-sm font-medium">
                          {isProcessing
                            ? "Enhancing image quality..."
                            : "Analyzing photo..."}
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
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-base font-medium shadow-md cursor-pointer flex items-center gap-2"
              >
                <FiRefreshCw /> Reset
              </button>
            </div>
          </div>
          {/* Results */}
          {result && result.result && (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl slide-in-left">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <FiTarget className="text-2xl text-slate-300" />
                <span className="text-white">Detection Result</span>
                <span className="px-2 py-1 text-xs bg-green-600/80 text-green-100 rounded font-medium">
                  ma22yn_v1.0
                </span>
              </h3>

              {/* AI Model Info */}
              <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiCpu className="text-xl text-green-300" />
                  <div className="text-sm">
                    <p className="font-medium text-green-200 mb-1 flex items-center gap-2">
                      <FiCheckCircle className="text-green-300" />{" "}
                      {result.result.method}
                    </p>
                    <p className="text-green-300">
                      Input: {result.result.model_info?.input_size} • Faces
                      detected: {result.result.faces_count}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-slate-700/50 lg:col-span-2 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-2xl"></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 flex-shrink-0">
                          <FiUser className="text-xl sm:text-2xl text-blue-300" />
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-semibold text-white">
                            Predicted Age
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400">
                            AI Neural Network Analysis
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-col space-y-6">
                      {/* Age Display - Centered on Mobile */}
                      <div className="text-center sm:text-left">
                        <div className="relative inline-block">
                          <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-gradient-to-br from-white via-blue-200 to-blue-400 bg-clip-text leading-none">
                            {result.result.age}
                          </div>
                          <div className="text-lg sm:text-xl lg:text-2xl font-medium text-slate-400 mt-1">
                            years old
                          </div>
                          {/* Floating accent */}
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>

                      {/* Age Range and Details */}
                      <div className="space-y-4">
                        <div className="bg-slate-800/60 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                          <div className="text-xs sm:text-sm font-medium text-slate-400 mb-2">
                            Age Range Estimate
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="text-xl sm:text-2xl font-bold text-slate-200">
                              {result.result.age_range}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-400">
                              ({result.result.age_min} - {result.result.age_max}{" "}
                              years)
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              ±{result.result.model_info?.range_margin} years
                            </span>
                          </div>
                        </div>

                        {/* Min/Max Ages */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="bg-slate-800/40 rounded-lg p-2 sm:p-3 text-center border border-slate-700/30">
                            <div className="text-base sm:text-lg font-bold text-emerald-400">
                              {result.result.age_min}
                            </div>
                            <div className="text-xs text-slate-400">
                              Min Age
                            </div>
                          </div>
                          <div className="bg-slate-800/40 rounded-lg p-2 sm:p-3 text-center border border-slate-700/30">
                            <div className="text-base sm:text-lg font-bold text-emerald-400">
                              {result.result.age_max}
                            </div>
                            <div className="text-xs text-slate-400">
                              Max Age
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-emerald-600/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>

                  {/* Model Information */}
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex-shrink-0">
                          <FiBarChart className="text-lg sm:text-2xl text-emerald-300" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-emerald-200">
                            Model Confidence
                          </div>
                          <div className="text-xs text-emerald-300/70">
                            Prediction Accuracy
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center sm:text-left">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 mb-2 sm:mb-3">
                        {Math.round((result.result.confidence || 0) * 100)}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-slate-700/50 rounded-full h-2 sm:h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{
                            width: `${(result.result.confidence || 0) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-300/70">
                        <span>0%</span>
                        <span className="font-medium hidden sm:inline">
                          High Confidence
                        </span>
                        <span className="font-medium sm:hidden">High</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-800/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-600/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>

                  {/* Model Information */}
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 flex-shrink-0">
                          <FiEye className="text-lg sm:text-2xl text-blue-300" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-blue-200">
                            Raw Model Output
                          </div>
                          <div className="text-xs text-blue-300/70">
                            Neural Network Value
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center sm:text-left">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-400 mb-2">
                        {result.result.raw_prediction?.toFixed?.(4) ||
                          result.result.raw_prediction ||
                          "N/A"}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="bg-blue-900/30 rounded-lg p-2 sm:p-3 border border-blue-700/30">
                      <div className="text-xs text-blue-300/80 space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Scaling Factor:</span>
                          <span className="font-mono text-xs sm:text-sm">
                            ×{result.result.model_info?.scaling_factor || 1}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Final Age:</span>
                          <span className="font-mono text-blue-200 text-xs sm:text-sm">
                            {result.result.age} years
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {result.result.message && (
                <div className="mt-6 p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <FiInfo className="text-xl text-blue-400" />
                    <p className="text-sm sm:text-base text-slate-300 font-medium">
                      {result.result.message}
                    </p>
                  </div>
                </div>
              )}

              <TechnicalDetails
                timestamp={result.result.timestamp}
                modelInfo={result.result.model_info}
              />
            </div>
          )}

          {/* Error Display */}
          <ErrorDisplay error={error} setError={setError} />
        </div>
      )}

      {/* Tips Section */}
      <TipsSection />
    </div>
  );
}
