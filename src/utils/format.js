import { ethers } from 'ethers';

/**
 * Format wei to ETH string
 * @param {string|bigint} wei - Amount in wei
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted ETH string
 */
export const formatWeiToEth = (wei, decimals = 4) => {
  try {
    if (!wei) return '0';
    const eth = ethers.formatEther(wei);
    return parseFloat(eth).toFixed(decimals);
  } catch (error) {
    console.error('Error formatting wei to ETH:', error);
    return '0';
  }
};

/**
 * Format ETH string to wei
 * @param {string} eth - Amount in ETH
 * @returns {bigint} Amount in wei
 */
export const formatEthToWei = (eth) => {
  try {
    if (!eth || isNaN(parseFloat(eth))) return '0';
    return ethers.parseEther(eth.toString());
  } catch (error) {
    console.error('Error formatting ETH to wei:', error);
    return '0';
  }
};

/**
 * Format address to shortened version
 * @param {string} address - Ethereum address
 * @param {number} chars - Number of characters to show on each side
 * @returns {string} Shortened address
 */
export const formatAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, decimals = 2) => {
  if (!num || isNaN(num)) return '0';
  
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (abs >= 1e9) {
    return sign + (abs / 1e9).toFixed(decimals) + 'B';
  } else if (abs >= 1e6) {
    return sign + (abs / 1e6).toFixed(decimals) + 'M';
  } else if (abs >= 1e3) {
    return sign + (abs / 1e3).toFixed(decimals) + 'K';
  } else {
    return sign + abs.toFixed(decimals);
  }
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  try {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  try {
    if (!timestamp) return '';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    
    return `${Math.floor(diff / 31536000)}y ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  try {
    if (!seconds || seconds < 0) return '0 seconds';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    if (secs > 0 && parts.length === 0) parts.push(`${secs} sec${secs > 1 ? 's' : ''}`);
    
    return parts.join(' ');
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0 seconds';
  }
};

/**
 * Format currency with symbol
 * @param {string|number} amount - Amount to format
 * @param {string} symbol - Currency symbol
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, symbol = 'ETH', decimals = 4) => {
  const formatted = formatNumber(parseFloat(amount), decimals);
  return `${formatted} ${symbol}`;
};