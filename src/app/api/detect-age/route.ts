import { NextRequest, NextResponse } from "next/server";

// Configuration for API endpoint
const API_CONFIG = {
  PYTHON_API_URL:
    process.env.PYTHON_API_URL || "http://localhost:6969/api/detect-age",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("image") as File; // Validate file
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

    // Forward request to Python backend
    const response = await fetch(API_CONFIG.PYTHON_API_URL, {
      method: "POST",
      body: pythonFormData,
      headers: {
        // Don't set Content-Type, let fetch handle it for FormData
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python API Error:", response.status, errorText);
      return NextResponse.json(
        {
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

    // Validate response structure
    if (
      typeof result.age !== "number" ||
      typeof result.confidence !== "number"
    ) {
      console.error("Invalid response from Python API:", result);
      return NextResponse.json(
        { error: "Invalid response from AI service" },
        { status: 502 }
      );
    }

    // Return processed result
    return NextResponse.json({
      age: result.age,
      confidence: result.confidence,
      gender: result.gender || null,
      message: result.message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Route Error:", error);

    // Handle specific error types
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to connect to AI service. Please try again later.",
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

export async function GET() {
  return NextResponse.json(
    {
      message: "Age Detection API",
      version: "1.0.0",
      methods: ["POST"],
      maxFileSize: "10MB",
      supportedFormats: API_CONFIG.ALLOWED_TYPES,
    },
    { status: 200 }
  );
}
