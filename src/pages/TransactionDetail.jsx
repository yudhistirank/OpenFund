import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { getExplorerUrl } from '../utils/network';
import { formatAddress } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const TransactionDetail = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const { provider, chainId } = useWallet();

  const [receipt, setReceipt] = useState(null);
  const [txData, setTxData] = useState(null);
  const [block, setBlock] = useState(null);
  const [confirmations, setConfirmations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (hash && provider) {
      loadTransactionDetails();
    }
  }, [hash, provider]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transaction receipt
      const txReceipt = await provider.getTransactionReceipt(hash);
      if (!txReceipt) {
        setError('Transaction not found. It may still be pending.');
        setLoading(false);
        return;
      }
      setReceipt(txReceipt);

      // Fetch transaction data (for value)
      const tx = await provider.getTransaction(hash);
      setTxData(tx);

      // Fetch block for timestamp
      if (txReceipt.blockNumber) {
        const blockData = await provider.getBlock(txReceipt.blockNumber);
        setBlock(blockData);

        // Calculate confirmations
        const currentBlock = await provider.getBlockNumber();
        setConfirmations(currentBlock - txReceipt.blockNumber);
      }
    } catch (err) {
      console.error('Error loading transaction details:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const explorerTxUrl = chainId ? getExplorerUrl(chainId, 'tx', hash) : '#';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Memuat detail transaksi..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Kembali
            </button>
            <button onClick={loadTransactionDetails} className="btn-primary">
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = receipt?.status === 1;
  const value = txData?.value ? ethers.formatEther(txData.value) : '0';
  const gasUsed = receipt?.gasUsed && receipt?.gasPrice
    ? ethers.formatEther(receipt.gasUsed * receipt.gasPrice)
    : receipt?.gasUsed ? receipt.gasUsed.toString() : '-';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="text-center pt-10 pb-6 px-8">
            {isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircleIcon className="w-12 h-12 text-red-500" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSuccess ? 'Transaction Success!' : 'Transaction Failed'}
            </h1>
            <p className="text-gray-500">
              {isSuccess
                ? 'Your transaction has been successfully confirmed on the blockchain.'
                : 'Your transaction failed. Please check the details below.'}
            </p>
          </div>

          {/* Detail Transaction */}
          <div className="px-8 pb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Detail Transaction
            </h3>

            <div className="divide-y divide-gray-100">
              {/* Transaction Hash */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border">
                    {formatAddress(hash, 8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(hash, 'hash')}
                    className="text-gray-400 hover:text-crypto-blue transition-colors"
                    title="Copy hash"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  {copied === 'hash' && <span className="text-xs text-green-500">Copied!</span>}
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-sm font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {isSuccess ? 'Success' : 'Failed'}
                </span>
              </div>

              {/* From */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">From</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-crypto-blue bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {txData?.from ? formatAddress(txData.from, 8) : '-'}
                  </span>
                  {txData?.from && (
                    <button
                      onClick={() => copyToClipboard(txData.from, 'from')}
                      className="text-gray-400 hover:text-crypto-blue"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  )}
                  {copied === 'from' && <span className="text-xs text-green-500">Copied!</span>}
                </div>
              </div>

              {/* To */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">To</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-crypto-blue bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {receipt?.to ? formatAddress(receipt.to, 8) : '-'}
                  </span>
                  {receipt?.to && (
                    <button
                      onClick={() => copyToClipboard(receipt.to, 'to')}
                      className="text-gray-400 hover:text-crypto-blue"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  )}
                  {copied === 'to' && <span className="text-xs text-green-500">Copied!</span>}
                </div>
              </div>

              {/* Value */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Value</span>
                <span className="text-sm font-semibold text-crypto-blue">
                  {parseFloat(value).toFixed(6)} ETH
                </span>
              </div>

              {/* Gas Used */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Gas Used</span>
                <span className="text-sm font-semibold text-green-600">
                  {typeof gasUsed === 'string' && gasUsed !== '-'
                    ? `${parseFloat(gasUsed).toFixed(6)} ETH`
                    : gasUsed}
                </span>
              </div>

              {/* Block Number */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Block Number</span>
                <span className="text-sm font-semibold text-gray-900">
                  #{receipt?.blockNumber?.toString() || '-'}
                </span>
              </div>

              {/* Confirmation */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Confirmation</span>
                <span className="text-sm font-semibold text-crypto-blue">
                  {confirmations}
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Timestamp</span>
                <span className="text-sm font-semibold text-crypto-blue">
                  {block ? formatTimestamp(block.timestamp) : '-'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <a
                href={explorerTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 border-2 border-crypto-blue text-crypto-blue rounded-lg font-medium hover:bg-crypto-light-blue transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                View Explorer
              </a>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-2.5 bg-crypto-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Dashboard
              </Link>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-400 mt-6 px-4">
              Your transaction has been successfully confirmed and permanently recorded on the blockchain. 
              You can view full details in the block explorer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
