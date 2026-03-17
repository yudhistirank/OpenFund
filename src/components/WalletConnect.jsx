import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/format';
import NetworkSelector from './NetworkSelector';
import { 
  WalletIcon, 
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const WalletConnect = ({ className = '' }) => {
  const {
    isConnected,
    account,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    switchAccount,
    isCorrectNetwork,
    getNetworkName,
    getFormattedBalance,
    shortAddress,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      const success = await connectWallet();
      if (!success) {
        console.error('Koneksi wallet gagal');
      }
    } catch (err) {
      console.error('Terjadi kesalahan tak terduga:', err);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    const success = await switchNetwork('base_sepolia');
    if (success) {
      setShowDropdown(false);
    }
    setIsSwitchingNetwork(false);
  };

  const handleSwitchAccount = async () => {
    setIsSwitchingAccount(true);
    setShowDropdown(false);
    try {
      await switchAccount();
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`btn-primary flex items-center space-x-2 ${className}`}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menghubungkan...</span>
            </>
          ) : (
            <>
              <WalletIcon className="w-5 h-5" />
              <span>Hubungkan Wallet</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Network Selector */}
      <NetworkSelector />
      
      {/* Wallet Info */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn-secondary flex items-center space-x-3 justify-between min-w-[200px]"
          disabled={isSwitchingAccount}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-crypto-blue rounded-full flex items-center justify-center">
              {isSwitchingAccount ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <WalletIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {isSwitchingAccount ? 'Mengganti akun...' : shortAddress}
              </div>
              <div className="text-xs text-gray-500">
                {getFormattedBalance(3)} {isCorrectNetwork() ? 'ETH' : '⚠️'}
              </div>
            </div>
          </div>
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
              {/* Wallet Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">Terhubung</span>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-crypto-blue transition-colors"
                    title="Salin alamat"
                  >
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-xs font-mono text-gray-600 break-all">
                    {formatAddress(account)}
                  </div>
                </div>
              </div>
              
              {/* Wallet Details */}
              <div className="p-4 space-y-3 border-b border-gray-100">
                {/* Balance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Saldo</span>
                  <span className="text-sm font-semibold text-gray-900">{getFormattedBalance(4)} ETH</span>
                </div>
                
                {/* Network */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Jaringan</span>
                  <span className="text-sm font-semibold text-gray-900">{getNetworkName(chainId)}</span>
                </div>
                
                {/* Network Status */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-semibold ${
                    isCorrectNetwork() ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isCorrectNetwork() ? 'Jaringan Sesuai' : 'Jaringan Salah'}
                  </span>
                </div>

                {/* Wrong Network Warning */}
                {!isCorrectNetwork() && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-orange-700">Jaringan tidak sesuai</p>
                        <p className="text-xs text-orange-600 mt-0.5">Beberapa fitur mungkin tidak berfungsi.</p>
                        <button
                          onClick={handleSwitchNetwork}
                          disabled={isSwitchingNetwork}
                          className="mt-2 text-xs font-medium text-orange-700 underline hover:no-underline"
                        >
                          {isSwitchingNetwork ? 'Mengganti jaringan...' : 'Ganti ke Base Sepolia'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="p-3 space-y-1">
                {/* Switch Account */}
                <button
                  onClick={handleSwitchAccount}
                  disabled={isSwitchingAccount}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowsRightLeftIcon className="w-4 h-4 text-gray-500" />
                  <span>Ganti Akun</span>
                </button>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Putuskan Koneksi</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-red-50 border border-red-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700">Masalah Koneksi</span>
          </div>
          <div className="text-sm text-red-600 mb-3">{error}</div>
          
          <div className="text-xs text-red-600 space-y-1">
            <div className="font-medium">Solusi Cepat:</div>
            <div>1. Klik ikon ekstensi MetaMask di browser Anda</div>
            <div>2. Masukkan kata sandi untuk membuka kunci (jika terkunci)</div>
            <div>3. Pastikan Anda memiliki setidaknya satu akun yang dibuat</div>
            <div>4. Coba hubungkan kembali</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
