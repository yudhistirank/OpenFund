import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  formatWeiToEth, 
  formatPercentage, 
  formatDate, 
  formatCurrency 
} from '../utils/format';
import { isCampaignActive, isCampaignEnded, isGoalReached } from '../utils/validation';
import { APP_CONSTANTS } from '../constants';
import { fetchFromIPFS } from '../utils/ipfs';
import useCurrentTime from '../hooks/useCurrentTime';
import { 
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const CampaignCard = ({ campaign, userPledge = '0', showCreator = true }) => {
  const now = useCurrentTime();
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  
  if (!campaign) return null;

  // Fetch metadata from IPFS
  useEffect(() => {
    if (campaign.metadata && campaign.metadata !== '') {
      setLoadingMetadata(true);
      fetchFromIPFS(campaign.metadata)
        .then((data) => {
          setMetadata(data);
        })
        .catch((error) => {
          console.error('Error fetching metadata:', error);
        })
        .finally(() => {
          setLoadingMetadata(false);
        });
    }
  }, [campaign.metadata]);

  const goal = parseFloat(formatWeiToEth(campaign.goal));
  const pledged = parseFloat(formatWeiToEth(campaign.pledged));
  const progressPercentage = goal > 0 ? (pledged / goal) * 100 : 0;
  const isActive = isCampaignActive(campaign);
  const hasEnded = isCampaignEnded(campaign);
  const goalReached = isGoalReached(campaign);
  const userPledgeAmount = parseFloat(formatWeiToEth(userPledge));

  const getStatusInfo = () => {
    if (hasEnded) {
      return goalReached 
        ? { text: 'Successful', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircleIcon }
        : { text: 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: XCircleIcon };
    }
    return isActive 
      ? { text: 'Active', color: 'text-crypto-blue', bg: 'bg-crypto-light-blue', icon: ClockIcon }
      : { text: 'Upcoming', color: 'text-orange-600', bg: 'bg-orange-50', icon: ClockIcon };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const timeRemaining = () => {
    if (hasEnded) return 'Ended';
    
    const endTime = campaign.endAt;
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ending soon';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return `${Math.floor(remaining / 60)}m left`;
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-200 group">
      {/* Campaign Image */}
      <div className="aspect-video bg-gradient-to-br from-crypto-light-blue to-blue-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {metadata?.image && !loadingMetadata ? (
          <img
            src={metadata.image}
            alt={metadata.title || 'Campaign image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
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
          {hasEnded ? formatDate(campaign.endAt) : timeRemaining()}
        </span>
      </div>

      {/* Campaign Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-crypto-blue transition-colors">
        {metadata?.title || `Campaign #${campaign.id}`}
      </h3>

      {/* Creator Info */}
      {showCreator && (
        <div className="flex items-center space-x-2 mb-3">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatCurrency(goal)} goal
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(pledged)} raised
          </span>
          <span className="text-sm text-gray-500">
            {formatPercentage(pledged, goal)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-crypto-blue'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Campaign Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Goal:</span>
          <span className="font-medium">{formatCurrency(goal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Deadline:</span>
          <span className="font-medium">{formatDate(campaign.endAt)}</span>
        </div>
        {userPledgeAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your pledge:</span>
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
          View Details
        </Link>
        
        {userPledgeAmount > 0 && (
          <button className="px-4 py-2 text-sm border border-crypto-blue text-crypto-blue rounded-lg hover:bg-crypto-light-blue transition-colors">
            Manage
          </button>
        )}
      </div>

      {/* Claim/Refund Notice */}
      {hasEnded && (
        <div className="mt-3 p-2 rounded-lg text-xs">
          {goalReached ? (
            <span className="text-green-700 bg-green-50">
              Campaign successful! Creator can claim funds.
            </span>
          ) : (
            <span className="text-red-700 bg-red-50">
              Goal not reached. Contributors can claim refunds.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignCard;