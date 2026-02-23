import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { APP_CONSTANTS, NETWORKS } from '../constants';

export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced Web3 provider detection
  const isWalletInstalled = () => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check for multiple wallet types
    const hasMetaMask = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    const hasGenericWallet = typeof window.ethereum !== 'undefined' && typeof window.ethereum.request === 'function';
    
    if (hasMetaMask) return true;
    if (hasGenericWallet) return true;
    
    // Check for other wallet providers
    const walletProviders = ['coinbaseWalletExtension', 'walletconnect', 'braveWallet', 'tokenary'];
    for (const provider of walletProviders) {
      if (typeof window[provider] !== 'undefined') {
        return true;
      }
    }
    
    return false;
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isWalletInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Enhanced wallet detection
      if (!isWalletInstalled()) {
        setError('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
        return false;
      }

      // Get the correct provider (MetaMask or other)
      let walletProvider = window.ethereum;
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        // Multiple providers available, prefer MetaMask
        walletProvider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
      }

      if (!walletProvider || typeof walletProvider.request !== 'function') {
        setError('Wallet provider not accessible. Please try refreshing the page.');
        return false;
      }

      // Request account access with better error handling
      let accounts;
      try {
        // First try to get existing accounts
        accounts = await walletProvider.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          // No existing accounts, request new connection
          accounts = await walletProvider.request({
            method: 'eth_requestAccounts',
          });
        }
      } catch (requestError) {
        console.error('Failed to access accounts:', requestError);
        
        if (requestError.code === 4001) {
          throw new Error('Connection request was rejected. Please approve the connection when prompted.');
        } else if (requestError.code === -32602) {
          throw new Error('Invalid request parameters. Please try again.');
        } else {
          throw new Error('Unable to connect to wallet. Please unlock your wallet and try again.');
        }
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please create or import an account in your wallet.');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(network.chainId.toString());
      setBalance(ethers.formatEther(balance));

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet();
        } else {
          // Refresh wallet data on account change
          connectWallet();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      
      // Provide more specific error messages
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection request when MetaMask prompts you.');
      } else if (err.code === -32603) {
        setError('Unable to access wallet. Please unlock MetaMask and ensure you have at least one account created.');
      } else if (err.message.includes('No active wallet found')) {
        setError('Wallet not accessible. Please unlock MetaMask and try again.');
      } else if (err.message.includes('Failed to access wallet accounts')) {
        setError('Cannot access wallet accounts. Please unlock MetaMask and make sure you have created an account.');
      } else {
        setError(err.message || 'Failed to connect wallet. Please try again.');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetNetwork = 'ethereum_sepolia') => {
    if (!isWalletInstalled()) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      setError(null);
      
      const networkConfig = NETWORKS[targetNetwork];
      if (!networkConfig) {
        throw new Error(`Network configuration not found for ${targetNetwork}`);
      }

      // Try to switch to the network first
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        });
        return true;
      } catch (switchError) {
        // If chain doesn't exist (4902), we need to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
            return true;
          } catch (addError) {
            setError(`Failed to add ${networkConfig.chainName} network: ${addError.message}`);
            return false;
          }
        }
        throw switchError;
      }
    } catch (err) {
      console.error('Error switching network:', err);
      
      // Provide more specific error messages
      if (err.code === 4001) {
        setError('Network switch rejected. Please approve the network change in MetaMask.');
      } else if (err.message.includes('already pending')) {
        setError('Network switch already in progress. Please wait or check MetaMask.');
      } else {
        setError(`Failed to switch to ${targetNetwork}: ${err.message}`);
      }
      return false;
    }
  }, []);

  // Get current network name
  const getNetworkName = useCallback((chainId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '137': 'Polygon',
      '8453': 'Base',
      '84532': 'Base Sepolia',
      '84534': 'Base Sepolia', // Corrected chain ID
      '11155111': 'Sepolia',
      '31337': 'Hardhat'
    };
    return networks[chainId] || `Network ${chainId}`;
  }, []);

  // Check if connected to supported network
  const isCorrectNetwork = useCallback(() => {
    const supportedNetworks = [
      '84532',    // Base Sepolia
      '11155111', // Ethereum Sepolia
      '8453',     // Base mainnet
      '1',        // Ethereum mainnet
      '31337'     // Hardhat
    ];
    return supportedNetworks.includes(chainId);
  }, [chainId]);

  // Get formatted balance
  const getFormattedBalance = useCallback((decimals = 4) => {
    try {
      return parseFloat(balance).toFixed(decimals);
    } catch {
      return '0';
    }
  }, [balance]);

  // Auto-connect if wallet was previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (isWalletInstalled() && window.ethereum.request) {
        try {
          // Check if accounts are already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();
            const balance = await provider.getBalance(address);

            setProvider(provider);
            setSigner(signer);
            setAccount(address);
            setChainId(network.chainId.toString());
            setBalance(ethers.formatEther(balance));

            // Set up listeners
            window.ethereum.on('accountsChanged', () => {
              window.location.reload();
            });

            window.ethereum.on('chainChanged', () => {
              window.location.reload();
            });
          }
        } catch (err) {
          console.error('Auto-connect error:', err);
          // Don't set error state for auto-connect failures
        }
      }
    };

    // Small delay to ensure window.ethereum is ready
    const timeoutId = setTimeout(autoConnect, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Update balance periodically
  useEffect(() => {
    if (!provider || !account) return;

    const updateBalance = async () => {
      try {
        const balance = await provider.getBalance(account);
        setBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Error updating balance:', err);
      }
    };

    // Update balance every 30 seconds
    const interval = setInterval(updateBalance, 30000);
    
    return () => clearInterval(interval);
  }, [provider, account]);

  return {
    // State
    provider,
    signer,
    account,
    balance,
    chainId,
    isConnecting,
    error,
    
    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isWalletInstalled,
    isCorrectNetwork,
    getNetworkName,
    getFormattedBalance,
    
    // Computed values
    isConnected: !!account,
    shortAddress: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '',
  };
};