// Web API Service Configuration
// File: age-detector/src/lib/api.ts

const API_CONFIG = {
  // Development URLs
  LOCAL_PYTHON_API: "http://localhost:6969",
  LOCAL_NEXT_API: "http://localhost:3000/api",

  // Production URLs (update with your actual domains)
  PRODUCTION_API: "http://localhost:6969",

  // Endpoints
  ENDPOINTS: {
    DETECT_AGE: "/api/detect-age",
    HEALTH: "/api/health",
  },

  // Settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  TIMEOUT: 30000, // 30 seconds for AI processing
};

// Get the appropriate API URL based on environment
function getApiUrl(): string {
  if (process.env.NODE_ENV === "production") {
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
    try {
      console.log("🔍 Starting age detection request");
      console.log("🔍 Base URL:", this.baseUrl);
      console.log("🔍 File:", imageFile.name, imageFile.type, imageFile.size);

      // Validate file
      this.validateImageFile(imageFile);

      // Create form data
      const formData = new FormData();
      formData.append("image", imageFile);

      console.log("🔍 FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
      );

      const requestUrl = `${this.baseUrl}${API_CONFIG.ENDPOINTS.DETECT_AGE}`;
      console.log("🔍 Request URL:", requestUrl);

      // Make API request
      const response = await fetch(requestUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          // Don't set Content-Type - let browser set it with boundary for multipart
        },
      });

      clearTimeout(timeoutId);

      console.log("🔍 Response status:", response.status);
      console.log(
        "🔍 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AgeDetectionResult = await response.json();
      return result;
    } catch (error) {
      console.error("Age detection API error:", error);
      throw this.handleApiError(error);
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`,
        {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout for health check
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  // Validate image file
  private validateImageFile(file: File): void {
    if (!API_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        "Unsupported file type. Please use JPEG, PNG, GIF, or WebP."
      );
    }

    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size is 10MB.");
    }
  }

  // Type guard for error objects
  private isErrorWithMessage(e: unknown): e is { message: string } {
    return (
      typeof e === "object" &&
      e !== null &&
      "message" in e &&
      typeof (e as { message: unknown }).message === "string"
    );
  }
  private isErrorWithName(e: unknown): e is { name: string } {
    return (
      typeof e === "object" &&
      e !== null &&
      "name" in e &&
      typeof (e as { name: unknown }).name === "string"
    );
  }

  // Handle API errors
  private handleApiError(error: unknown): Error {
    if (this.isErrorWithName(error) && error.name === "AbortError") {
      return new Error("Request timeout. Please try again.");
    }
    if (
      this.isErrorWithMessage(error) &&
      error.message.includes("Failed to fetch")
    ) {
      return new Error(
        "Network error. Please check your connection and ensure the AI server is running."
      );
    }
    if (this.isErrorWithMessage(error)) {
      return new Error(error.message);
    }
    return new Error("An unexpected error occurred.");
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export configuration for use in components
export { API_CONFIG };
