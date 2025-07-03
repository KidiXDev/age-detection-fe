import { NextRequest, NextResponse } from "next/server";

// Configuration for API endpoint
const API_CONFIG = {
  PYTHON_API_URL: process.env.PYTHON_API_URL || getDefaultPythonUrl(),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

function getDefaultPythonUrl(): string {
  if (process.env.NODE_ENV === "production") {
    // In production, use environment variable or default production URL
    return process.env.PYTHON_API_URL || "http://localhost:6969/api/detect-age";
  }
  // In development
  return "http://localhost:8000/api/detect-age";
}

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!API_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Please upload JPG, PNG, or WebP images only.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Prepare form data for Python API
    const pythonFormData = new FormData();
    pythonFormData.append("image", file);

    console.log("Connecting to Python API:", API_CONFIG.PYTHON_API_URL);

    // Forward request to Python backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(API_CONFIG.PYTHON_API_URL, {
      method: "POST",
      body: pythonFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python API Error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process image",
          details:
            response.status === 500
              ? "Internal server error"
              : "API unavailable",
        },
        { status: response.status }
      );
    }

    // Parse response from Python API
    const result = await response.json();
    console.log("Python API Response:", result);

    // Return the result as-is if it has the expected structure
    if (result.success !== undefined) {
      return NextResponse.json(result);
    }

    // If it's a simple response, wrap it
    return NextResponse.json({
      success: true,
      age: result.age || result.predicted_age,
      confidence: result.confidence || 0.8,
      raw_prediction:
        result.raw_prediction || result.age || result.predicted_age,
      gender: result.gender || null,
      message: result.message || "Age detection completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Route Error:", error);

    // Handle specific error types
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout. Please try again." },
        { status: 408 }
      );
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to connect to AI service. Please ensure the Python server is running.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
