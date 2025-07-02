interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={`${sizeClasses[size]} border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin`}>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full"></div>
        </div>
        
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse`}></div>
        </div>
      </div>
      
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}>
          {text}
        </span>
      )}
    </div>
  );
}
