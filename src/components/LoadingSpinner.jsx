import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  className = '',
  color = 'text-crypto-blue',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        {/* Spinner */}
        <div className={`${spinnerSize} border-2 border-gray-200 border-t-transparent rounded-full animate-spin ${color}`}></div>
        
        {/* Loading Text */}
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;