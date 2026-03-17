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
  message = 'Mohon tunggu sementara transaksi Anda sedang diproses.',
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
          title: 'Transaksi Berhasil!',
          message: 'Transaksi Anda telah dikonfirmasi di blockchain.'
        };
      case 'error':
        return {
          icon: ExclamationCircleIcon,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Transaksi Gagal',
          message: message || 'Transaksi Anda tidak dapat diselesaikan. Silakan coba lagi.'
        };
      default:
        return {
          icon: ArrowPathIcon,
          iconColor: 'text-crypto-blue',
          bgColor: 'bg-crypto-light-blue',
          borderColor: 'border-crypto-blue',
          title: 'Transaksi Sedang Diproses',
          message: 'Mohon tunggu sementara transaksi Anda sedang diproses.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Lapisan latar belakang */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Panel modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              {statusInfo.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Ikon Status dan Konten */}
          <div className="flex items-start space-x-4">
            {/* Ikon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
              <StatusIcon 
                className={`w-6 h-6 ${statusInfo.iconColor} ${
                  status === 'pending' ? 'animate-spin' : ''
                }`} 
              />
            </div>

            {/* Konten */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {statusInfo.message}
              </p>
              
              {/* Hash Transaksi */}
              {hash && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Hash Transaksi:</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate font-mono">
                      {hash}
                    </code>
                    {onViewOnExplorer && (
                      <button
                        onClick={() => onViewOnExplorer(hash)}
                        className="text-xs text-crypto-blue hover:text-crypto-blue-dark font-medium whitespace-nowrap"
                      >
                        Lihat
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex space-x-2">
                {status === 'error' && onRetry && (
                  <button
                    onClick={onRetry}
                    className="btn-primary text-sm"
                  >
                    Coba Lagi
                  </button>
                )}
                
                {status === 'success' && (
                  <button
                    onClick={onClose}
                    className="btn-primary text-sm"
                  >
                    Selesai
                  </button>
                )}
                
                {(status === 'pending' || status === 'error') && (
                  <button
                    onClick={onClose}
                    className="btn-secondary text-sm"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Animasi Loading */}
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
