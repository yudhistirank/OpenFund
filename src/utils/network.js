import { NETWORKS } from '../constants';

/**
 * Get the appropriate blockchain explorer URL based on chain ID
 * @param {string} chainId - The blockchain chain ID
 * @param {string} type - Type of URL ('tx' | 'address' | 'block')
 * @param {string} value - The transaction hash, address, or block number
 * @returns {string} - The explorer URL
 */
export const getExplorerUrl = (chainId, type = 'tx', value) => {
  if (!chainId || !value) return '#';

  const explorers = {
    '84532': { // Base Sepolia
      base: 'https://sepolia.basescan.org',
      tx: (hash) => `https://sepolia.basescan.org/tx/${hash}`,
      address: (addr) => `https://sepolia.basescan.org/address/${addr}`,
      block: (block) => `https://sepolia.basescan.org/block/${block}`
    },
    '11155111': { // Ethereum Sepolia
      base: 'https://sepolia.etherscan.io',
      tx: (hash) => `https://sepolia.etherscan.io/tx/${hash}`,
      address: (addr) => `https://sepolia.etherscan.io/address/${addr}`,
      block: (block) => `https://sepolia.etherscan.io/block/${block}`
    },
    '8453': { // Base Mainnet
      base: 'https://basescan.org',
      tx: (hash) => `https://basescan.org/tx/${hash}`,
      address: (addr) => `https://basescan.org/address/${addr}`,
      block: (block) => `https://basescan.org/block/${block}`
    },
    '1': { // Ethereum Mainnet
      base: 'https://etherscan.io',
      tx: (hash) => `https://etherscan.io/tx/${hash}`,
      address: (addr) => `https://etherscan.io/address/${addr}`,
      block: (block) => `https://etherscan.io/block/${block}`
    }
  };

  const explorer = explorers[chainId];
  if (!explorer) return '#';

  if (type === 'base') return explorer.base;
  if (typeof explorer[type] === 'function') {
    return explorer[type](value);
  }

  return explorer.base;
};

/**
 * Get network display information
 * @param {string} chainId - The blockchain chain ID
 * @returns {Object} - Network information
 */
export const getNetworkInfo = (chainId) => {
  const networks = {
    '84532': {
      name: 'Base Sepolia',
      shortName: 'Base Sepolia',
      color: 'blue',
      icon: '🔷',
      currency: 'ETH',
      isTestnet: true
    },
    '11155111': {
      name: 'Ethereum Sepolia',
      shortName: 'Eth Sepolia',
      color: 'purple',
      icon: '🔷',
      currency: 'ETH',
      isTestnet: true
    },
    '8453': {
      name: 'Base',
      shortName: 'Base',
      color: 'blue',
      icon: '🔵',
      currency: 'ETH',
      isTestnet: false
    },
    '1': {
      name: 'Ethereum',
      shortName: 'Ethereum',
      color: 'gray',
      icon: '♦️',
      currency: 'ETH',
      isTestnet: false
    }
  };

  return networks[chainId] || {
    name: `Network ${chainId}`,
    shortName: `Network ${chainId}`,
    color: 'gray',
    icon: '🌐',
    currency: 'ETH',
    isTestnet: false
  };
};

/**
 * Check if a chain ID is supported by the application
 * @param {string} chainId - The blockchain chain ID
 * @returns {boolean} - True if supported
 */
export const isSupportedNetwork = (chainId) => {
  const supportedNetworks = ['84532', '11155111', '8453', '1'];
  return supportedNetworks.includes(chainId);
};

/**
 * Get recommended networks for the application
 * @returns {Array} - List of recommended network chain IDs
 */
export const getRecommendedNetworks = () => {
  return [
    {
      chainId: '84532',
      name: 'Base Sepolia',
      description: 'Recommended for testing - Lower fees',
      priority: 1
    },
    {
      chainId: '11155111',
      name: 'Ethereum Sepolia',
      description: 'Alternative test network',
      priority: 2
    }
  ];
};

/**
 * Get network key from chain ID
 * @param {string} chainId - The blockchain chain ID
 * @returns {string} - Network key
 */
export const getNetworkKey = (chainId) => {
  const networkKeys = {
    '84532': 'base_sepolia',
    '11155111': 'ethereum_sepolia',
    '8453': 'base_mainnet',
    '1': 'ethereum_mainnet'
  };
  return networkKeys[chainId] || null;
};

/**
 * Get chain ID from network key
 * @param {string} networkKey - The network key
 * @returns {string} - Chain ID
 */
export const getChainIdFromKey = (networkKey) => {
  const chainIds = {
    'base_sepolia': '84532',
    'ethereum_sepolia': '11155111',
    'base_mainnet': '8453',
    'ethereum_mainnet': '1'
  };
  return chainIds[networkKey] || null;
};

/**
 * Format network name for display
 * @param {string} chainId - The blockchain chain ID
 * @param {boolean} short - Whether to use short name
 * @returns {string} - Formatted network name
 */
export const formatNetworkName = (chainId, short = false) => {
  const info = getNetworkInfo(chainId);
  return short ? info.shortName : info.name;
};