import React from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const TransactionStatus = ({ 
  isOpen, 
  onClose, 
  status = 'pending', 
  title = 'Transaction Pending', 
  message = 'Please wait while your transaction is being processed.',
  hash,
  onRetry,
  onViewOnExplorer
}) => {
  if (!isOpen) return null;

  const getStatusInfo = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Transaction Successful!',
          message: 'Your transaction has been confirmed on the blockchain.'
        };
      case 'error':
        return {
          icon: ExclamationCircleIcon,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Transaction Failed',
          message: message || 'Your transaction could not be completed. Please try again.'
        };
      default:
        return {
          icon: ArrowPathIcon,
          iconColor: 'text-crypto-blue',
          bgColor: 'bg-crypto-light-blue',
          borderColor: 'border-crypto-blue',
          title: 'Transaction Pending',
          message: 'Please wait while your transaction is being processed.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {statusInfo.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Status Icon and Content */}
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
              <StatusIcon 
                className={`w-6 h-6 ${statusInfo.iconColor} ${
                  status === 'pending' ? 'animate-spin' : ''
                }`} 
              />
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {statusInfo.message}
              </p>
              
              {/* Transaction Hash */}
              {hash && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate font-mono">
                      {hash}
                    </code>
                    {onViewOnExplorer && (
                      <button
                        onClick={() => onViewOnExplorer(hash)}
                        className="text-xs text-crypto-blue hover:text-crypto-blue-dark font-medium"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {status === 'error' && onRetry && (
                  <button
                    onClick={onRetry}
                    className="btn-primary text-sm"
                  >
                    Try Again
                  </button>
                )}
                
                {status === 'success' && (
                  <button
                    onClick={onClose}
                    className="btn-primary text-sm"
                  >
                    Done
                  </button>
                )}
                
                {(status === 'pending' || status === 'error') && (
                  <button
                    onClick={onClose}
                    className="btn-secondary text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          {status === 'pending' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-crypto-blue h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;