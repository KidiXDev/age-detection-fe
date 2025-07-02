export interface AgeDetectionResultBase {
  success: boolean;
  error?: string;
  message?: string;
}

export interface AgeDetectionResult extends AgeDetectionResultBase {
  result?: {
    age: number;
    age_range: string;
    age_min: number;
    age_max: number;
    confidence: number;
    raw_prediction?: number;
    gender?: string;
    message: string;
    method: string;
    model_info: ModelInfo;
    timestamp: string;
    face_detected: boolean;
    faces_count: number;
  };
}

export interface RawApiResponse {
  success?: boolean;
  age?: number;
  predicted_age?: number;
  confidence?: number;
  raw_prediction?: number;
  gender?: string;
  message?: string;
  timestamp?: string;
  error?: string;
  result?: {
    age?: number;
    confidence?: number;
    raw_prediction?: number;
    gender?: string;
    message?: string;
    timestamp?: string;
    model_info?: {
      scaling_factor?: number;
    };
    faces_count?: number;
  };
}

interface ModelInfo {
  input_size: string;
  scaling_factor: number;
  range_margin: number;
}

// Utility Types
export type LoadingState = "idle" | "loading" | "success" | "error";
export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export interface ResponseTransformer {
  transformApiResponse(rawResponse: RawApiResponse): AgeDetectionResult;
}
