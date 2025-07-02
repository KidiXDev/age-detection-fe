// Web API Service Configuration
// File: age-detector/src/lib/api.ts

const API_CONFIG = {
  // Development URLs
  LOCAL_PYTHON_API: 'http://localhost:8000',
  LOCAL_NEXT_API: 'http://localhost:3000/api',
  
  // Production URLs (update with your actual domains)
  PRODUCTION_API: 'https://your-api-domain.com',
  
  // Endpoints
  ENDPOINTS: {
    DETECT_AGE: '/api/detect-age',
    HEALTH: '/api/health'
  },
  
  // Settings
  USE_DUMMY_DATA: false, // Set to true for testing, false for real AI
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  TIMEOUT: 30000 // 30 seconds for AI processing
};

// Get the appropriate API URL based on environment
function getApiUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return API_CONFIG.PRODUCTION_API;
  }
  
  // In development, use Python API if available, otherwise use dummy
  return API_CONFIG.LOCAL_PYTHON_API;
}

// API Response Types - Updated for Mayan Akurat API
export interface AgeDetectionResult {
  success: boolean;
  result?: {
    age: number;
    age_range: string;
    age_min: number;
    age_max: number;
    confidence: number;
    raw_prediction: number;
    gender?: string;
    message: string;
    method: string;
    model_info: {
      input_size: string;
      scaling_factor: number;
      range_margin: number;
    };
    timestamp: string;
    face_detected: boolean;
    faces_count: number;
  };
  error?: string;
  message?: string;
}

// API Service Class
export class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = getApiUrl();
  }

  // Detect age from image file
  async detectAge(imageFile: File): Promise<AgeDetectionResult> {
    // Use dummy data if configured
    if (API_CONFIG.USE_DUMMY_DATA) {
      return this.generateDummyResult();
    }

    try {
      console.log('🔍 Starting age detection request');
      console.log('🔍 Base URL:', this.baseUrl);
      console.log('🔍 File:', imageFile.name, imageFile.type, imageFile.size);
      
      // Validate file
      this.validateImageFile(imageFile);

      // Create form data
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('🔍 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const requestUrl = `${this.baseUrl}${API_CONFIG.ENDPOINTS.DETECT_AGE}`;
      console.log('🔍 Request URL:', requestUrl);

      // Make API request
      const response = await fetch(requestUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Don't set Content-Type - let browser set it with boundary for multipart
        }
      });

      clearTimeout(timeoutId);

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AgeDetectionResult = await response.json();
      return result;

    } catch (error) {
      console.error('Age detection API error:', error);
      throw this.handleApiError(error);
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  // Validate image file
  private validateImageFile(file: File): void {
    if (!API_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please use JPEG, PNG, GIF, or WebP.');
    }

    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
  }

  // Generate dummy result for development
  private async generateDummyResult(): Promise<AgeDetectionResult> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const ages = [18, 22, 25, 28, 32, 35, 38, 42, 45, 28, 33, 27, 29, 31, 24, 26, 30, 34, 36, 40];
    const genders = ['male', 'female'];
    const confidences = [0.85, 0.92, 0.78, 0.89, 0.94, 0.81, 0.87, 0.91, 0.83, 0.88];
    const messages = [
      'Age detected successfully using Mayan Akurat AI model',
      'Wajah terdeteksi dengan jelas menggunakan AI',
      'Kualitas gambar baik untuk prediksi akurat',
      'Fitur wajah terlihat dengan baik oleh model AI'
    ];

    const randomIndex = Math.floor(Math.random() * ages.length);
    const predictedAge = ages[randomIndex];
    const rangeMargin = 3;
    const ageMin = Math.max(0, predictedAge - rangeMargin);
    const ageMax = predictedAge + rangeMargin;

    return {
      success: true,
      result: {
        age: predictedAge,
        age_range: `${ageMin}-${ageMax} tahun`,
        age_min: ageMin,
        age_max: ageMax,
        confidence: confidences[Math.floor(Math.random() * confidences.length)],
        raw_prediction: predictedAge / 100, // Simulate raw model output
        gender: genders[Math.floor(Math.random() * genders.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        method: "Mayan Akurat AI Neural Network (Dummy Mode)",
        model_info: {
          input_size: "200x200",
          scaling_factor: 100,
          range_margin: 3
        },
        timestamp: new Date().toISOString(),
        face_detected: true,
        faces_count: 1
      }
    };
  }

  // Handle API errors
  private handleApiError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout. Please try again.');
    }
    
    if (error.message?.includes('Failed to fetch')) {
      return new Error('Network error. Please check your connection and ensure the AI server is running.');
    }
    
    return new Error(error.message || 'An unexpected error occurred.');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export configuration for use in components
export { API_CONFIG };
