'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { AgeDetectionResult, LoadingState, FileValidationResult } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface AgeDetectorProps {
  className?: string;
}

export default function AgeDetector({ className = '' }: AgeDetectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [result, setResult] = useState<AgeDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback((file: File): FileValidationResult => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Pilih file gambar yang valid (JPG, PNG, WebP)' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Ukuran file terlalu besar. Pilih gambar di bawah 10MB' };
    }

    return { valid: true };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
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
  }, []);

  // Detect age function
  const detectAge = async (file: File) => {
    setLoadingState('loading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use direct Python API (port 8000) instead of Next.js API
      const response = await fetch('http://localhost:8000/api/detect-age', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setLoadingState('success');
      } else {
        throw new Error(data.error || data.message || 'Gagal mendeteksi umur');
      }
    } catch (err) {
      console.error('Error detecting age:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendeteksi umur');
      setLoadingState('error');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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

  // Reset function
  const resetDetector = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setLoadingState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Simple Header */}
      <div className="text-center mb-8 sm:mb-12 slide-in-left">
        <div className="relative inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              🎯 AI Age Detector
            </span>
          </h1>
          <div className="absolute -inset-1 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl blur opacity-40"></div>
        </div>
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload foto dan biarkan <span className="font-semibold text-slate-200">AI canggih</span> menganalisis 
          dan memprediksi umur dengan <span className="font-semibold text-slate-100">akurasi tinggi</span>. 
          Simple, cepat, dan akurat. ✨
        </p>
      </div>

      {/* Upload Area */}
      {!selectedImage && (
        <div className="slide-in-right">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300
              ${isDragging 
                ? 'border-slate-400 bg-slate-800/60 scale-105' 
                : 'border-slate-600 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-800/50'
              }
              ${loadingState === 'loading' ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              backdrop-blur-sm shadow-lg hover:shadow-xl
            `}
            onDragOver={handleDragOver}
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
              disabled={loadingState === 'loading'}
            />
            
            <div className="space-y-4 sm:space-y-6">
              <div className={`text-5xl sm:text-6xl transition-transform duration-300 ${isDragging ? 'scale-110' : 'hover:scale-110'}`}>
                📷
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {isDragging ? (
                    <span className="text-slate-200">Drop foto di sini! 📥</span>
                  ) : (
                    'Upload Foto'
                  )}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base mb-4">
                  Drag dan drop gambar, atau klik untuk pilih file
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">JPG</span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">PNG</span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">WebP</span>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">Max 10MB</span>
                </div>
              </div>
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
                  {loadingState === 'loading' && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-300 text-sm">Menganalisis foto...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex lg:flex-col gap-3 justify-center">
                <button
                  onClick={resetDetector}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  🔄 Reset
                </button>
                <button
                  onClick={triggerFileInput}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  📷 Foto Lain
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && result.result && (
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl slide-in-left">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-white">Hasil Deteksi</span>
                <span className="px-2 py-1 text-xs bg-green-600/80 text-green-100 rounded font-medium">
                  � AI ASLI
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
                      Model: Mayan Akurat • Input: {result.result.model_info?.input_size} • 
                      Wajah terdeteksi: {result.result.faces_count}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Age Range */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👤</span>
                    <div className="text-sm font-medium text-slate-400">Prediksi Umur</div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-3xl sm:text-4xl font-bold text-white">
                      {result.result.age}
                      <span className="text-lg sm:text-xl ml-1 text-slate-400">tahun</span>
                    </div>
                    <div className="text-slate-300">
                      <div className="text-sm font-medium text-slate-400 mb-1">Range Prediksi:</div>
                      <div className="text-lg font-semibold">{result.result.age_range}</div>
                    </div>
                  </div>
                </div>
                
                {/* Confidence */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <div className="text-sm font-medium text-slate-400">Confidence</div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                    {Math.round(result.result.confidence * 100)}%
                  </div>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Raw Prediction */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔬</span>
                    <div className="text-sm font-medium text-slate-400">Raw Model Output</div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">
                    {result.result.raw_prediction.toFixed(4)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    × {result.result.model_info?.scaling_factor} = {result.result.age} tahun
                  </div>
                </div>

                {result.result.gender && (
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-slate-700/50 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{result.result.gender === 'male' ? '👨' : '👩'}</span>
                      <div className="text-sm font-medium text-slate-400">Jenis Kelamin</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold text-white capitalize">
                      {result.result.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
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
                  Detail Teknis
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div>
                    <div className="font-medium text-slate-300">Timestamp</div>
                    <div>{new Date(result.result.timestamp).toLocaleTimeString('id-ID')}</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-300">Range Margin</div>
                    <div>±{result.result.model_info?.range_margin} tahun</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-300">Model Input</div>
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
                  <h4 className="font-semibold text-red-200 mb-2">Terjadi Kesalahan</h4>
                  <p className="text-red-300 text-sm sm:text-base">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 px-3 py-1 bg-red-800/50 hover:bg-red-700/50 text-red-200 rounded text-sm transition-colors"
                  >
                    Tutup
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
          Tips untuk Hasil Terbaik
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Gunakan foto yang jelas dan tajam</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Pastikan wajah terlihat dengan baik</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Hindari foto yang terlalu gelap</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>Foto frontal memberikan hasil terbaik</span>
          </div>
        </div>
      </div>
    </div>
  );
}
