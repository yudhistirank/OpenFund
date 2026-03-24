import React from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useTranslation } from '../i18n';
import { formatAddress } from '../utils/format';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const DonorRank = ({ donors = [], isLoading = false }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-crypto-blue" />
          Donatur
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
          <UserGroupIcon className="w-5 h-5 text-crypto-blue" />
          Donatur
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
        <UserGroupIcon className="w-5 h-5 text-crypto-blue" />
        Donatur
        <span className="text-sm font-normal text-gray-500 ml-auto">
          {donors.length} {donors.length === 1 ? 'donation' : 'donations'}
        </span>
      </h3>

      <div className="space-y-2">
        {donors.map((donation, index) => {
          const amountEth = parseFloat(ethers.formatEther(donation.amount)).toFixed(4);

          return (
            <div
              key={`${donation.txHash}-${index}`}
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
                {/* Rank indicator */}
                <div className="w-8 text-center flex-shrink-0">
                  {index < 3 ? (
                    <StarSolidIcon className={`w-5 h-5 mx-auto ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'
                    }`} />
                  ) : (
                    <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                  )}
                </div>

                {/* Donor address + tx link */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {formatAddress(donation.address, 6)}
                    </span>
                    <Link
                      to={`/tx/${donation.txHash}`}
                      className="text-gray-400 hover:text-crypto-blue"
                      title="View transaction detail"
                    >
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Block #{donation.blockNumber}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex items-center gap-1.5">
                <CurrencyDollarIcon className="w-4 h-4 text-crypto-blue" />
                <span className="text-sm font-bold text-crypto-blue">{amountEth} ETH</span>
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
