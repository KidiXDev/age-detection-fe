export interface AgeDetectionResult {
  success: boolean;
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
  error?: string;
  message?: string;
}

interface ModelInfo {
  input_size: string;
  scaling_factor: number;
  range_margin: number;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
  maxSize?: number;
  acceptedTypes?: string[];
}

export interface ResultDisplayProps {
  result: AgeDetectionResult;
  onReset: () => void;
}

// Form Types
export interface UploadFormData {
  image: File | null;
}

// Configuration Types
export interface AppConfig {
  apiUrl: string;
  maxFileSize: number;
  allowedTypes: string[];
  appName: string;
  version: string;
}

// Utility Types
export type LoadingState = "idle" | "loading" | "success" | "error";
export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };

// Events
export interface ImageUploadEvent {
  file: File;
  preview: string;
}

export interface ProcessingEvent {
  stage: "upload" | "processing" | "complete" | "error";
  progress?: number;
  message?: string;
}

// API Response Types for better response management
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

export interface ResponseTransformer {
  transformApiResponse(rawResponse: RawApiResponse): AgeDetectionResult;
}
