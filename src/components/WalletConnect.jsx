import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/format';
import NetworkSelector from './NetworkSelector';
import { 
  WalletIcon, 
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
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
    isCorrectNetwork,
    getNetworkName,
    getFormattedBalance,
    shortAddress,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const handleConnect = async () => {
    try {
      const success = await connectWallet();
      if (!success) {
        // Error is already set in the hook
        console.error('Wallet connection failed');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
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

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <NetworkSelector />
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`btn-primary flex items-center space-x-2 ${className}`}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WalletIcon className="w-5 h-5" />
              <span>Connect Wallet</span>
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
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-crypto-blue rounded-full flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {shortAddress}
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
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatAddress(account)}
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Balance */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Balance</span>
                <span className="text-sm font-medium">{getFormattedBalance(4)} ETH</span>
              </div>
              
              {/* Network */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Network</span>
                <span className="text-sm font-medium">{getNetworkName(chainId)}</span>
              </div>
              
              {/* Network Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${
                  isCorrectNetwork() ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {isCorrectNetwork() ? 'Correct Network' : 'Wrong Network'}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-3 border-t border-gray-200 space-y-2">
              <button
                onClick={handleDisconnect}
                className="w-full text-sm px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Connection Issue</span>
          </div>
          <div className="text-sm text-red-600 mb-3">{error}</div>
          
          {/* Help Instructions */}
          <div className="text-xs text-red-600 space-y-1">
            <div className="font-medium">Quick Fix:</div>
            <div>1. Click the MetaMask extension in your browser</div>
            <div>2. Enter your password to unlock (if locked)</div>
            <div>3. Make sure you have at least one account created</div>
            <div>4. Try connecting again</div>
            {error.includes('wallet') && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                💡 <strong>Still not working?</strong> Try refreshing this page or restarting your browser.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;