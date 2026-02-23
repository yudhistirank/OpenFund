import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const LoadMoreButton = ({ 
  onClick, 
  loading = false, 
  disabled = false, 
  hasMore = true, 
  className = '',
  children = 'Load More'
}) => {
  return (
    <div className={`text-center ${className}`}>
      {hasMore && (
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={`
            inline-flex items-center space-x-2 px-6 py-3 
            bg-crypto-blue text-white rounded-lg
            hover:bg-crypto-blue-dark transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-crypto-blue focus:ring-offset-2
            ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>{children}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </>
          )}
        </button>
      )}
      
      {!hasMore && (
        <p className="text-gray-500 text-sm">
          No more campaigns to load
        </p>
      )}
    </div>
  );
};

export default LoadMoreButton;