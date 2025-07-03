import React from "react";
import { FiAlertCircle } from "react-icons/fi";

export interface ErrorDisplayProps {
  error: string | null;
  setError: (error: string | null) => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, setError }) => {
  if (!error) return null;

  return (
    <div className="bg-red-900/30 backdrop-blur-sm border border-red-600/50 rounded-lg p-4 sm:p-6 scale-in">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="text-2xl text-red-400" />
        <div>
          <h4 className="font-semibold text-red-200 mb-2">An Error Occurred</h4>
          <p className="text-red-300 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 px-3 py-1 bg-red-800/50 hover:bg-red-700/50 text-red-200 rounded text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
