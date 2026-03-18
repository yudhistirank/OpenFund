import React from 'react';
import { ethers } from 'ethers';
import { useTranslation } from '../i18n';
import { formatAddress } from '../utils/format';
import { getExplorerUrl } from '../utils/network';
import { useWallet } from '../hooks/useWallet';
import {
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const DonorRank = ({ donors = [], isLoading = false }) => {
  const { t } = useTranslation();
  const { chainId } = useWallet();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          {t('detail.donor_rank_title') || 'Donor Ranking'}
        </h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-blue"></div>
        </div>
      </div>
    );
  }

  if (!donors || donors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          {t('detail.donor_rank_title') || 'Donor Ranking'}
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          {t('detail.no_donors') || 'No donors yet. Be the first to contribute!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-yellow-500" />
        {t('detail.donor_rank_title') || 'Donor Ranking'}
        <span className="text-sm font-normal text-gray-500 ml-auto">
          {donors.length} {t('detail.donor_count') || 'donors'}
        </span>
      </h3>

      <div className="space-y-3">
        {donors.map((donor, index) => {
          const amountEth = parseFloat(ethers.formatEther(donor.totalAmount)).toFixed(4);
          const explorerUrl = chainId ? getExplorerUrl(chainId, 'address', donor.address) : '#';
          const medal = index < 3 ? RANK_MEDALS[index] : null;

          return (
            <div
              key={donor.address}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                index === 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : index === 1
                  ? 'bg-gray-50 border-gray-200'
                  : index === 2
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Rank */}
                <div className="w-8 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                  )}
                </div>

                {/* Address */}
                <div>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono font-medium text-gray-900 hover:text-crypto-blue flex items-center gap-1"
                  >
                    {formatAddress(donor.address, 6)}
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400" />
                  </a>
                  <p className="text-xs text-gray-500">
                    {donor.donationCount} {donor.donationCount === 1 ? 'donation' : 'donations'}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="text-sm font-bold text-crypto-blue">{amountEth} ETH</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* On-chain data notice */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        {t('detail.onchain_data_notice') || 'Data sourced from blockchain events (on-chain)'}
      </p>
    </div>
  );
};

export default DonorRank;
