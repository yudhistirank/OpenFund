import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  formatWeiToEth, 
  formatPercentage, 
  formatDate, 
  formatCurrency 
} from '../utils/format';
import {
  getCampaignStatusLocal,
  isCampaignEnded,
  isCampaignCancelled,
  isCampaignClaimed,
  isGoalReached
} from '../utils/validation';
import { CAMPAIGN_STATUS } from '../constants';
import { fetchFromIPFS } from '../utils/ipfs';
import useCurrentTime from '../hooks/useCurrentTime';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const CampaignCard = ({ campaign, userPledge = '0', showCreator = true }) => {
  const now = useCurrentTime();
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  
  // Fetch metadata from IPFS
  useEffect(() => {
    if (!campaign) return;
    if (campaign.metadata && campaign.metadata !== '') {
      let cancelled = false;
      setLoadingMetadata(true); // eslint-disable-line
      fetchFromIPFS(campaign.metadata)
        .then((data) => {
          if (!cancelled) setMetadata(data);
        })
        .catch((error) => {
          console.error('Error fetching metadata:', error);
        })
        .finally(() => {
          if (!cancelled) setLoadingMetadata(false);
        });
      return () => { cancelled = true; };
    }
  }, [campaign?.metadata]);

  if (!campaign) return null;

  const goal = parseFloat(formatWeiToEth(campaign.goal));
  const pledged = parseFloat(formatWeiToEth(campaign.pledged));
  const progressPercentage = goal > 0 ? (pledged / goal) * 100 : 0;
  const campaignStatus = getCampaignStatusLocal(campaign);
  const hasEnded = isCampaignEnded(campaign);
  const isCancelled = isCampaignCancelled(campaign);
  const isClaimed = isCampaignClaimed(campaign);
  const goalReached = isGoalReached(campaign);
  const userPledgeAmount = parseFloat(formatWeiToEth(userPledge));

  const getStatusInfo = () => {
    switch (campaignStatus) {
      case CAMPAIGN_STATUS.CANCELLED:
        return { text: 'Dibatalkan', color: 'text-gray-600', bg: 'bg-gray-100', icon: NoSymbolIcon };
      case CAMPAIGN_STATUS.CLAIMED:
        return { text: 'Dicairkan', color: 'text-purple-600', bg: 'bg-purple-50', icon: CheckCircleIcon };
      case CAMPAIGN_STATUS.SUCCESSFUL:
        return { text: 'Berhasil', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircleIcon };
      case CAMPAIGN_STATUS.FAILED:
        return { text: 'Gagal', color: 'text-red-600', bg: 'bg-red-50', icon: XCircleIcon };
      case CAMPAIGN_STATUS.ACTIVE:
        return { text: 'Aktif', color: 'text-crypto-blue', bg: 'bg-crypto-light-blue', icon: ClockIcon };
      case CAMPAIGN_STATUS.UPCOMING:
      default:
        return { text: 'Akan Datang', color: 'text-orange-600', bg: 'bg-orange-50', icon: ClockIcon };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const timeRemaining = () => {
    if (isCancelled) return 'Dibatalkan';
    if (hasEnded) return 'Selesai';
    
    const endTime = campaign.endAt;
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Segera berakhir';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) return `${days}h ${hours}j tersisa`;
    if (hours > 0) return `${hours}j tersisa`;
    return `${Math.floor(remaining / 60)}m tersisa`;
  };

  return (
    <div className={`card hover:shadow-lg transition-all duration-200 group ${isCancelled ? 'opacity-60' : ''}`}>
      {/* Campaign Image */}
      <div className="aspect-video bg-gradient-to-br from-crypto-light-blue to-blue-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {metadata?.image && !loadingMetadata ? (
          <img
            src={metadata.image}
            alt={metadata.title || 'Gambar kampanye'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`${metadata?.image && !loadingMetadata ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
          {loadingMetadata ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-blue"></div>
          ) : (
            <CurrencyDollarIcon className="w-16 h-16 text-crypto-blue opacity-20" />
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusInfo.text}</span>
        </span>
        
        <span className="text-xs text-gray-500">
          {isCancelled ? 'Dibatalkan' : hasEnded ? formatDate(campaign.endAt) : timeRemaining()}
        </span>
      </div>

      {/* Campaign Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-crypto-blue transition-colors">
        {metadata?.title || `Kampanye #${campaign.id}`}
      </h3>

      {/* Creator Info */}
      {showCreator && (
        <div className="flex items-center space-x-2 mb-3">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatCurrency(goal)} target
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(pledged)} terkumpul
          </span>
          <span className="text-sm text-gray-500">
            {formatPercentage(pledged, goal)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCancelled ? 'bg-gray-400' :
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-crypto-blue'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Campaign Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target:</span>
          <span className="font-medium">{formatCurrency(goal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tenggat:</span>
          <span className="font-medium">{formatDate(campaign.endAt)}</span>
        </div>
        {userPledgeAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Kontribusi Anda:</span>
            <span className="font-medium text-crypto-blue">{formatCurrency(userPledgeAmount)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link
          to={`/campaign/${campaign.id}`}
          className="flex-1 btn-primary text-center text-sm"
        >
          Lihat Detail
        </Link>
        
        {userPledgeAmount > 0 && !isCancelled && (
          <Link
            to={`/campaign/${campaign.id}`}
            className="px-4 py-2 text-sm border border-crypto-blue text-crypto-blue rounded-lg hover:bg-crypto-light-blue transition-colors"
          >
            Kelola
          </Link>
        )}
      </div>

      {/* Claim/Refund Notification */}
      {hasEnded && !isCancelled && (
        <div className="mt-3 p-2 rounded-lg text-xs">
          {isClaimed ? (
            <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded">
              Dana telah dicairkan oleh pembuat kampanye.
            </span>
          ) : goalReached ? (
            <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
              Kampanye berhasil! Pembuat dapat mencairkan dana.
            </span>
          ) : (
            <span className="text-red-700 bg-red-50 px-2 py-1 rounded">
              Target tidak tercapai. Kontributor dapat meminta pengembalian dana.
            </span>
          )}
        </div>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <div className="mt-3 p-2 rounded-lg text-xs">
          <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">
            Kampanye ini telah dibatalkan.
          </span>
        </div>
      )}
    </div>
  );
};

export default CampaignCard;
