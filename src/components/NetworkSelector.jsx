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
      const targetNetworkKey = getNetworkKey(networkKey) || networkKey;
      const success = await switchNetwork(targetNetworkKey);
      if (!success) {
        console.error('Pergantian jaringan gagal');
      }
    } catch (err) {
      console.error('Error pergantian jaringan:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <GlobeAltIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Hubungkan wallet</span>
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
            <span className="text-sm font-medium text-gray-900 hidden sm:inline">
              {currentNetwork.name}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </>
        ) : (
          <>
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600 hidden sm:inline">Jaringan Tidak Didukung</span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </>
        )}
        {isSwitching && (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Pilih Jaringan</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pilih jaringan blockchain yang ingin Anda gunakan
              </p>
            </div>
            
            <div className="p-2">
              {supportedNetworks.map((network) => {
                const isCurrentNetwork = currentNetwork?.chainId === network.key;
                
                return (
                  <button
                    key={network.key}
                    onClick={() => handleNetworkSwitch(network.key)}
                    disabled={isSwitching || isCurrentNetwork}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors disabled:cursor-not-allowed ${
                      isCurrentNetwork 
                        ? `${network.bgColor} ${network.borderColor} border` 
                        : 'hover:bg-gray-50 disabled:opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{network.icon}</span>
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
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Network Info */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-gray-700 mb-1.5">Informasi Jaringan:</div>
                <div>• Kedua jaringan menggunakan ETH untuk biaya gas</div>
                <div>• Kontrak telah di-deploy di kedua jaringan</div>
                <div>• Biaya lebih rendah di jaringan Base</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;
