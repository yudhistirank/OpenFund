import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getRecommendedNetworks, getNetworkInfo, getNetworkKey } from '../utils/network';
import { NETWORKS } from '../constants';
import { 
  ChevronDownIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const NetworkSelector = ({ className = '' }) => {
  const {
    chainId,
    isConnected,
    switchNetwork,
    isCorrectNetwork,
    getNetworkName,
    isWalletInstalled
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const supportedNetworks = getRecommendedNetworks().map(network => {
    const info = getNetworkInfo(network.chainId);
    return {
      key: network.chainId,
      name: info.name,
      shortName: info.shortName,
      icon: info.icon,
      color: info.color,
      bgColor: info.isTestnet ? 'bg-blue-50' : 'bg-green-50',
      borderColor: info.isTestnet ? 'border-blue-200' : 'border-green-200',
      description: network.description,
      priority: network.priority
    };
  });

  const currentNetwork = getNetworkInfo(chainId);

  const handleNetworkSwitch = async (networkKey) => {
    if (!isWalletInstalled()) {
      return;
    }

    setIsSwitching(true);
    setShowDropdown(false);
    
    try {
      // Convert chainId to networkKey if needed
      const targetNetworkKey = getNetworkKey(networkKey) || networkKey;
      const success = await switchNetwork(targetNetworkKey);
      if (!success) {
        console.error('Network switch failed');
      }
    } catch (err) {
      console.error('Network switch error:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <GlobeAltIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">Connect wallet to select network</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Network Selector Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isSwitching}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {currentNetwork ? (
          <>
            <span className="text-lg">{currentNetwork.icon}</span>
            <span className="text-sm font-medium text-gray-900">
              {currentNetwork.name}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </>
        ) : (
          <>
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600">Unsupported Network</span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Select Network</h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose your preferred blockchain network
              </p>
            </div>
            
            <div className="p-2">
              {supportedNetworks.map((network) => {
                const isCurrentNetwork = currentNetwork?.chainId === network.key;
                
                return (
                  <button
                    key={network.key}
                    onClick={() => handleNetworkSwitch(network.key)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors disabled:opacity-50 ${
                      isCurrentNetwork 
                        ? `${network.bgColor} ${network.borderColor} border` 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{network.icon}</span>
                      <div className="text-left">
                        <div className={`text-sm font-medium ${
                          network.color === 'blue' ? 'text-blue-600' :
                          network.color === 'purple' ? 'text-purple-600' :
                          network.color === 'green' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {network.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {network.description}
                        </div>
                      </div>
                    </div>
                    
                    {isCurrentNetwork && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Network Info */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium">Network Information:</div>
                <div>• Both networks use ETH for gas fees</div>
                <div>• Contracts are deployed on both networks</div>
                <div>• Lower fees on Base network</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;