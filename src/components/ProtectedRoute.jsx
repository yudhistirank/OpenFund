import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import WalletConnect from './WalletConnect';
import { LockClosedIcon } from '@heroicons/react/24/outline';

/**
 * Komponen ProtectedRoute — membatasi akses halaman hanya untuk pengguna
 * yang telah menghubungkan wallet mereka.
 */
const ProtectedRoute = ({ children }) => {
  const { isConnected, isConnecting } = useWallet();
  const location = useLocation();

  // Jika masih dalam proses menghubungkan, tampilkan loading
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-crypto-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Memverifikasi koneksi wallet...</p>
        </div>
      </div>
    );
  }

  // Jika wallet belum terhubung, tampilkan halaman akses ditolak
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-crypto-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="w-8 h-8 text-crypto-blue" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Akses Terbatas
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-2 leading-relaxed">
            Halaman ini hanya dapat diakses oleh pengguna yang telah menghubungkan wallet mereka.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Silakan hubungkan wallet Anda untuk melanjutkan ke{' '}
            <span className="font-medium text-gray-700">
              {location.pathname === '/dashboard' ? 'Dashboard' : 'halaman ini'}
            </span>
            .
          </p>

          {/* Connect Wallet Button */}
          <div className="flex justify-center">
            <WalletConnect className="w-full justify-center" />
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
            <p className="text-xs text-blue-700 font-medium mb-1">💡 Belum punya wallet?</p>
            <p className="text-xs text-blue-600">
              Unduh{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                MetaMask
              </a>
              {' '}atau wallet Web3 lainnya untuk mulai menggunakan OpenFund.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
