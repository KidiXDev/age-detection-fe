import { NextRequest, NextResponse } from 'next/server';

// Configuration for API endpoint
const API_CONFIG = {
  // TODO: Replace with your actual Python backend URL when ready
  PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:5000/api/detect-age',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  // Set to true to use dummy data for development/testing
  USE_DUMMY_DATA: process.env.USE_DUMMY_DATA === 'true' || true, // Default to true for development
};

// Dummy data generator for development purposes
function generateDummyResult(filename: string): any {
  // Generate realistic dummy data based on filename or random
  const possibleAges = [18, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60];
  const possibleGenders = ['male', 'female'];
  const possibleMessages = [
    'Face detected successfully!',
    'Clear facial features detected.',
    'Good image quality for accurate prediction.',
    'Multiple faces detected, using the most prominent one.',
  ];

  // Simple hash-like function based on filename for consistent results
  const hash = filename.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const ageIndex = Math.abs(hash) % possibleAges.length;
  const genderIndex = Math.abs(hash >> 1) % possibleGenders.length;
  const messageIndex = Math.abs(hash >> 2) % possibleMessages.length;

  return {
    age: possibleAges[ageIndex] + (Math.abs(hash >> 3) % 10) - 5, // Add some variance
    confidence: 0.75 + (Math.abs(hash >> 4) % 25) / 100, // 0.75 - 1.0
    gender: possibleGenders[genderIndex],
    message: possibleMessages[messageIndex],
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('image') as File;    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!API_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload JPG, PNG, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // TODO: Remove this dummy data section when Python backend is ready
    // ================================================================
    // DUMMY DATA SECTION - FOR DEVELOPMENT ONLY
    // ================================================================
    if (API_CONFIG.USE_DUMMY_DATA) {
      // Simulate processing delay (realistic API behavior)
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Generate dummy result based on file name for consistency
      const dummyResult = generateDummyResult(file.name);

      console.log('🧪 Using dummy data for development:', dummyResult);      return NextResponse.json({
        success: true,
        result: {
          age: Math.round(dummyResult.age),
          confidence: Math.min(Math.max(dummyResult.confidence, 0.6), 0.98), // Clamp between 0.6-0.98
          gender: dummyResult.gender,
          message: `${dummyResult.message} (Demo Mode - Replace with real API)`,
          timestamp: new Date().toISOString(),
          isDummy: true, // Flag to indicate this is dummy data
        }
      });
    }
    // ================================================================
    // END DUMMY DATA SECTION
    // ================================================================

    // TODO: Uncomment and configure this section when Python backend is ready
    /*
    // Prepare form data for Python API
    const pythonFormData = new FormData();
    pythonFormData.append('image', file);

    // Forward request to Python backend
    const response = await fetch(API_CONFIG.PYTHON_API_URL, {
      method: 'POST',
      body: pythonFormData,
      headers: {
        // Don't set Content-Type, let fetch handle it for FormData
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to process image',
          details: response.status === 500 ? 'Internal server error' : 'API unavailable'
        },
        { status: response.status }
      );
    }

    // Parse response from Python API
    const result = await response.json();

    // Validate response structure
    if (typeof result.age !== 'number' || typeof result.confidence !== 'number') {
      console.error('Invalid response from Python API:', result);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
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
    });    */

    // Fallback error if dummy data is disabled but real API is not configured
    return NextResponse.json(
      { success: false, error: 'AI service not configured. Please set up Python backend or enable dummy data.' },
      { status: 503 }
    );

  } catch (error) {
    console.error('API Route Error:', error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { success: false, error: 'Unable to connect to AI service. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Age Detection API',
      version: '1.0.0',
      methods: ['POST'],
      maxFileSize: '10MB',
      supportedFormats: API_CONFIG.ALLOWED_TYPES,
    },
    { status: 200 }
  );
}
