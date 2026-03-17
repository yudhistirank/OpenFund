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
  const [availableAccounts, setAvailableAccounts] = useState([]);

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
      setError('MetaMask belum terpasang. Silakan pasang MetaMask untuk melanjutkan.');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Get the correct provider (MetaMask or other)
      let walletProvider = window.ethereum;
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        walletProvider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
      }

      if (!walletProvider || typeof walletProvider.request !== 'function') {
        setError('Wallet provider tidak dapat diakses. Silakan coba muat ulang halaman.');
        return false;
      }

      // Request account access
      let accounts;
      try {
        accounts = await walletProvider.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          accounts = await walletProvider.request({
            method: 'eth_requestAccounts',
          });
        }
      } catch (requestError) {
        console.error('Gagal mengakses akun:', requestError);
        
        if (requestError.code === 4001) {
          throw new Error('Permintaan koneksi ditolak. Silakan setujui permintaan koneksi ketika diminta.');
        } else if (requestError.code === -32602) {
          throw new Error('Parameter permintaan tidak valid. Silakan coba lagi.');
        } else {
          throw new Error('Tidak dapat terhubung ke wallet. Silakan buka kunci wallet Anda dan coba lagi.');
        }
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('Tidak ada akun wallet yang ditemukan. Silakan buat atau impor akun di wallet Anda.');
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
      setAvailableAccounts(accounts);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet();
        } else {
          window.location.reload();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      
      if (err.code === 4001) {
        setError('Koneksi ditolak. Silakan setujui permintaan koneksi ketika MetaMask meminta.');
      } else if (err.code === -32603) {
        setError('Tidak dapat mengakses wallet. Silakan buka kunci MetaMask dan pastikan Anda telah membuat setidaknya satu akun.');
      } else if (err.message.includes('No active wallet found')) {
        setError('Wallet tidak dapat diakses. Silakan buka kunci MetaMask dan coba lagi.');
      } else {
        setError(err.message || 'Gagal menghubungkan wallet. Silakan coba lagi.');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Switch to a different account (triggers MetaMask account selection)
  const switchAccount = useCallback(async () => {
    if (!isWalletInstalled()) {
      setError('MetaMask belum terpasang.');
      return false;
    }

    try {
      setError(null);
      // Request account access again to show the account selector
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // Get all available accounts after selection
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
        setAvailableAccounts(accounts);
        return true;
      }
      return false;
    } catch (err) {
      if (err.code === 4001) {
        // User cancelled, this is fine
        return false;
      }
      console.error('Error switching account:', err);
      setError('Gagal mengganti akun. Silakan coba lagi.');
      return false;
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
    setAvailableAccounts([]);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetNetwork = 'ethereum_sepolia') => {
    if (!isWalletInstalled()) {
      setError('MetaMask belum terpasang');
      return false;
    }

    try {
      setError(null);
      
      const networkConfig = NETWORKS[targetNetwork];
      if (!networkConfig) {
        throw new Error(`Konfigurasi jaringan tidak ditemukan untuk ${targetNetwork}`);
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
            setError(`Gagal menambahkan jaringan ${networkConfig.chainName}: ${addError.message}`);
            return false;
          }
        }
        throw switchError;
      }
    } catch (err) {
      console.error('Error switching network:', err);
      
      if (err.code === 4001) {
        setError('Pergantian jaringan ditolak. Silakan setujui perubahan jaringan di MetaMask.');
      } else if (err.message.includes('already pending')) {
        setError('Pergantian jaringan sedang dalam proses. Silakan tunggu atau periksa MetaMask.');
      } else {
        setError(`Gagal beralih ke ${targetNetwork}: ${err.message}`);
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
      '84534': 'Base Sepolia',
      '11155111': 'Sepolia',
      '31337': 'Hardhat'
    };
    return networks[chainId] || `Jaringan ${chainId}`;
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
            setAvailableAccounts(accounts);

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
        }
      }
    };

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
    availableAccounts,
    
    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,
    switchAccount,
    isWalletInstalled,
    isCorrectNetwork,
    getNetworkName,
    getFormattedBalance,
    
    // Computed values
    isConnected: !!account,
    shortAddress: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '',
  };
};
