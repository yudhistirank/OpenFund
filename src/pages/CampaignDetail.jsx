import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { 
  formatWeiToEth, 
  formatDate, 
  formatCurrency, 
  formatPercentage 
} from '../utils/format';
import { isCampaignActive, isCampaignEnded, isGoalReached } from '../utils/validation';
import { fetchFromIPFS } from '../utils/ipfs';
import TransactionStatus from '../components/TransactionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const { 
    getCampaignById, 
    getUserContribution, 
    pledge, 
    unpledge, 
    claim, 
    refund
  } = useContract();
  
  const [campaign, setCampaign] = useState(null);
  const [userPledge, setUserPledge] = useState('0');
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [txStatus, setTxStatus] = useState({
    isOpen: false,
    status: 'pending',
    hash: null,
    action: null
  });
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  useEffect(() => {
    if (campaign && isConnected && address) {
      loadUserContribution();
    }
  }, [campaign, isConnected, address]);

  // Fetch metadata from IPFS
  useEffect(() => {
    if (campaign?.metadata && campaign.metadata !== '') {
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
  }, [campaign?.metadata]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaignById(id);
      setCampaign(campaignData);
    } catch (error) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserContribution = async () => {
    try {
      if (campaign && address) {
        const contribution = await getUserContribution(id, address);
        setUserPledge(contribution);
      }
    } catch (error) {
      console.error('Error loading user contribution:', error);
    }
  };

  const handlePledge = async () => {
    if (!isConnected) return;
    if (!pledgeAmount || parseFloat(pledgeAmount) <= 0) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'pledge'
    });

    try {
      const amountWei = (parseFloat(pledgeAmount) * Math.pow(10, 18)).toString();
      const result = await pledge(id, amountWei);
      
      if (result.hash) {
        setTxStatus(prev => ({ ...prev, hash: result.hash }));
        await result.wait();
        
        setTxStatus(prev => ({ ...prev, status: 'success' }));
        setPledgeAmount('');
        await loadCampaign();
        await loadUserContribution();
      }
    } catch (error) {
      console.error('Error pledging:', error);
      setTxStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleUnpledge = async () => {
    if (!isConnected || !userPledge || parseFloat(userPledge) === 0) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'unpledge'
    });

    try {
      const result = await unpledge(id);
      
      if (result.hash) {
        setTxStatus(prev => ({ ...prev, hash: result.hash }));
        await result.wait();
        
        setTxStatus(prev => ({ ...prev, status: 'success' }));
        await loadCampaign();
        await loadUserContribution();
      }
    } catch (error) {
      console.error('Error unpledging:', error);
      setTxStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !campaign) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'claim'
    });

    try {
      const result = await claim(id);
      
      if (result.hash) {
        setTxStatus(prev => ({ ...prev, hash: result.hash }));
        await result.wait();
        
        setTxStatus(prev => ({ ...prev, status: 'success' }));
        await loadCampaign();
      }
    } catch (error) {
      console.error('Error claiming:', error);
      setTxStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleRefund = async () => {
    if (!isConnected || !userPledge || parseFloat(userPledge) === 0) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'refund'
    });

    try {
      const result = await refund(id);
      
      if (result.hash) {
        setTxStatus(prev => ({ ...prev, hash: result.hash }));
        await result.wait();
        
        setTxStatus(prev => ({ ...prev, status: 'success' }));
        await loadCampaign();
        await loadUserContribution();
      }
    } catch (error) {
      console.error('Error refunding:', error);
      setTxStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleRetry = () => {
    setTxStatus({
      isOpen: false,
      status: 'pending',
      hash: null,
      action: null
    });

    // Retry the last action
    switch (txStatus.action) {
      case 'pledge':
        handlePledge();
        break;
      case 'unpledge':
        handleUnpledge();
        break;
      case 'claim':
        handleClaim();
        break;
      case 'refund':
        handleRefund();
        break;
    }
  };

  const handleClose = () => {
    setTxStatus({
      isOpen: false,
      status: 'pending',
      hash: null,
      action: null
    });
  };

  const viewOnExplorer = (hash) => {
    const explorerUrl = `https://basescan.org/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  const shareCampaign = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading campaign..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn-primary"
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Campaign Image */}
            <div className="aspect-video bg-gradient-to-br from-crypto-light-blue to-blue-100 rounded-lg mb-8 flex items-center justify-center overflow-hidden">
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crypto-blue"></div>
                ) : (
                  <CurrencyDollarIcon className="w-24 h-24 text-crypto-blue opacity-20" />
                )}
              </div>
            </div>

            {/* Status and Share */}
            <div className="flex items-center justify-between mb-6">
              <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span>{statusInfo.text}</span>
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  {isLiked ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={shareCampaign}
                  className="p-2 text-gray-400 hover:text-crypto-blue transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Campaign Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {metadata?.title || `Campaign #${campaign.id}`}
            </h1>

            {/* Campaign Description */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed">
                {metadata?.description || 'No description available'}
              </p>
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Creator</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {campaign.creator === address ? 'You' : `${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`}
                  </p>
                  <p className="text-sm text-gray-600">Campaign Creator</p>
                </div>
              </div>
            </div>

            {/* Updates Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Updates</h3>
              <p className="text-gray-600">No updates yet. Check back later!</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Funding Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Progress</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-crypto-blue">
                    {formatCurrency(pledged)}
                  </span>
                  <span className="text-sm text-gray-600">
                    of {formatCurrency(goal)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progressPercentage >= 100 ? 'bg-green-500' : 'bg-crypto-blue'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  {formatPercentage(pledged, goal)} funded
                </p>
              </div>

              {/* Campaign Stats */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="font-medium">{formatDate(campaign.endAt)}</span>
                </div>
                {userPledgeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your pledge:</span>
                    <span className="font-medium text-crypto-blue">{formatCurrency(userPledgeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{statusInfo.text}</span>
                </div>
              </div>
            </div>

            {/* Pledge/Unpledge Section */}
            {isConnected && isActive && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {userPledgeAmount > 0 ? 'Manage Your Pledge' : 'Support This Campaign'}
                </h3>

                {userPledgeAmount > 0 && (
                  <div className="mb-4 p-3 bg-crypto-light-blue rounded-lg">
                    <p className="text-sm text-crypto-blue">
                      You have pledged {formatCurrency(userPledgeAmount)} to this campaign
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (ETH)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(e.target.value)}
                        placeholder="0.1"
                        min="0.001"
                        step="0.001"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {userPledgeAmount > 0 && (
                      <button
                        onClick={handleUnpledge}
                        className="flex-1 btn-secondary"
                      >
                        Unpledge
                      </button>
                    )}
                    <button
                      onClick={handlePledge}
                      disabled={!pledgeAmount || parseFloat(pledgeAmount) <= 0}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {userPledgeAmount > 0 ? 'Add More' : 'Pledge'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Claim/Refund Section */}
            {hasEnded && isConnected && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {goalReached ? 'Campaign Successful' : 'Campaign Failed'}
                </h3>
                
                {goalReached ? (
                  // Creator can claim funds
                  campaign.creator === address ? (
                    <button
                      onClick={handleClaim}
                      className="w-full btn-primary"
                    >
                      Claim Funds
                    </button>
                  ) : (
                    <p className="text-green-600 text-sm">
                      Campaign was successful! Creator has claimed the funds.
                    </p>
                  )
                ) : (
                  // Contributors can claim refunds
                  userPledgeAmount > 0 ? (
                    <button
                      onClick={handleRefund}
                      className="w-full btn-secondary"
                    >
                      Claim Refund
                    </button>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Campaign goal was not reached. Contributors can claim refunds.
                    </p>
                  )
                )}
              </div>
            )}

            {/* Connect Wallet CTA */}
            {!isConnected && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your wallet to support this campaign
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary w-full"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Status Modal */}
      <TransactionStatus
        isOpen={txStatus.isOpen}
        onClose={handleClose}
        status={txStatus.status}
        hash={txStatus.hash}
        onRetry={txStatus.status === 'error' ? handleRetry : null}
        onViewOnExplorer={viewOnExplorer}
      />
    </div>
  );
};

export default CampaignDetail;