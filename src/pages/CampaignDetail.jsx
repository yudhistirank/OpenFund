import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { CAMPAIGN_STATUS } from '../constants';
import { 
  formatWeiToEth, 
  formatDate, 
  formatCurrency, 
  formatPercentage 
} from '../utils/format';
import {
  getCampaignStatusLocal,
  isCampaignActive,
  isCampaignEnded,
  isCampaignCancelled,
  isCampaignClaimed,
  isGoalReached
} from '../utils/validation';
import { fetchFromIPFS } from '../utils/ipfs';
import { getExplorerUrl } from '../utils/network';
import TransactionStatus from '../components/TransactionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import WalletConnect from '../components/WalletConnect';
import {
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShareIcon,
  HeartIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isConnected, signer, chainId } = useWallet();
  const { 
    getCampaign, 
    getUserPledgedAmount, 
    pledgeToCampaign, 
    unpledgeFromCampaign, 
    claimFunds, 
    getRefund,
    cancelCampaign
  } = useContract(signer, account);
  
  const [campaign, setCampaign] = useState(null);
  const [userPledge, setUserPledge] = useState('0');
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [unpledgeAmount, setUnpledgeAmount] = useState('');
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
  }, [id, getCampaign]);

  useEffect(() => {
    if (campaign && isConnected && account) {
      loadUserContribution();
    }
  }, [campaign, isConnected, account]);

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
      const campaignData = await getCampaign(id);
      setCampaign(campaignData);
    } catch (error) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserContribution = async () => {
    try {
      if (campaign && account) {
        const contribution = await getUserPledgedAmount(id);
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
      const result = await pledgeToCampaign(id, pledgeAmount);
      
      setTxStatus(prev => ({ 
        ...prev, 
        status: 'success',
        hash: result?.hash || null
      }));
      setPledgeAmount('');
      await loadCampaign();
      await loadUserContribution();
    } catch (error) {
      console.error('Error pledging:', error);
      setTxStatus(prev => ({ ...prev, status: 'error', message: error.message }));
    }
  };

  const handleUnpledge = async () => {
    if (!isConnected) return;
    const amount = unpledgeAmount || formatWeiToEth(userPledge);
    if (!amount || parseFloat(amount) <= 0) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'unpledge'
    });

    try {
      const result = await unpledgeFromCampaign(id, amount);
      
      setTxStatus(prev => ({ 
        ...prev, 
        status: 'success',
        hash: result?.hash || null
      }));
      setUnpledgeAmount('');
      await loadCampaign();
      await loadUserContribution();
    } catch (error) {
      console.error('Error unpledging:', error);
      setTxStatus(prev => ({ ...prev, status: 'error', message: error.message }));
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
      const result = await claimFunds(id);
      
      setTxStatus(prev => ({ 
        ...prev, 
        status: 'success',
        hash: result?.hash || null
      }));
      await loadCampaign();
    } catch (error) {
      console.error('Error claiming:', error);
      setTxStatus(prev => ({ ...prev, status: 'error', message: error.message }));
    }
  };

  const handleRefund = async () => {
    if (!isConnected) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'refund'
    });

    try {
      const result = await getRefund(id);
      
      setTxStatus(prev => ({ 
        ...prev, 
        status: 'success',
        hash: result?.hash || null
      }));
      await loadCampaign();
      await loadUserContribution();
    } catch (error) {
      console.error('Error refunding:', error);
      setTxStatus(prev => ({ ...prev, status: 'error', message: error.message }));
    }
  };

  const handleCancel = async () => {
    if (!isConnected || !campaign) return;

    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null,
      action: 'cancel'
    });

    try {
      const result = await cancelCampaign(id);
      
      setTxStatus(prev => ({ 
        ...prev, 
        status: 'success',
        hash: result?.hash || null
      }));
      await loadCampaign();
    } catch (error) {
      console.error('Error cancelling:', error);
      setTxStatus(prev => ({ ...prev, status: 'error', message: error.message }));
    }
  };

  const handleRetry = () => {
    const lastAction = txStatus.action;
    setTxStatus({
      isOpen: false,
      status: 'pending',
      hash: null,
      action: null
    });

    // Retry last action
    switch (lastAction) {
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
      case 'cancel':
        handleCancel();
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
    const explorerUrl = getExplorerUrl(chainId, 'tx', hash);
    window.open(explorerUrl, '_blank');
  };

  const shareCampaign = () => {
    if (navigator.share) {
      navigator.share({
        title: metadata?.title || `Campaign #${campaign?.id}`,
        text: metadata?.description || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Memuat kampanye..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kampanye Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Kampanye yang Anda cari tidak tersedia atau sudah tidak ada.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="btn-primary"
          >
            Jelajahi Kampanye
          </button>
        </div>
      </div>
    );
  }

  const goal = parseFloat(formatWeiToEth(campaign.goal));
  const pledged = parseFloat(formatWeiToEth(campaign.pledged));
  const progressPercentage = goal > 0 ? (pledged / goal) * 100 : 0;
  const campaignStatus = getCampaignStatusLocal(campaign);
  const isActive = isCampaignActive(campaign);
  const hasEnded = isCampaignEnded(campaign);
  const isCancelled = isCampaignCancelled(campaign);
  const isClaimed = isCampaignClaimed(campaign);
  const goalReached = isGoalReached(campaign);
  const userPledgeAmount = parseFloat(formatWeiToEth(userPledge));
  const isCreator = campaign.creator.toLowerCase() === (account || '').toLowerCase();
  const isUpcoming = campaignStatus === CAMPAIGN_STATUS.UPCOMING;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Campaign Image */}
            <div className="aspect-video bg-gradient-to-br from-crypto-light-blue to-blue-100 rounded-xl mb-8 flex items-center justify-center overflow-hidden">
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
                  title={isLiked ? 'Hapus dari favorit' : 'Tambah ke favorit'}
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
                  title="Bagikan kampanye"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Campaign Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {metadata?.title || `Kampanye #${campaign.id}`}
            </h1>

            {/* Campaign Description */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed">
                {metadata?.description || 'Deskripsi tidak tersedia'}
              </p>
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pembuat Kampanye</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {isCreator ? 'Anda' : `${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`}
                  </p>
                  <p className="text-sm text-gray-500">Pembuat Kampanye</p>
                </div>
              </div>
            </div>

            {/* Cancelled Notice */}
            {isCancelled && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                <div className="flex items-center space-x-3">
                  <NoSymbolIcon className="w-8 h-8 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Kampanye Dibatalkan</h3>
                    <p className="text-gray-500 text-sm">Kampanye ini telah dibatalkan oleh pembuatnya sebelum dimulai.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Updates Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pembaruan Kampanye</h3>
              <p className="text-gray-500 text-sm">Belum ada pembaruan. Kunjungi kembali nanti!</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Funding Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progres Pendanaan</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-crypto-blue">
                    {formatCurrency(pledged)}
                  </span>
                  <span className="text-sm text-gray-600">
                    dari {formatCurrency(goal)}
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
                  {formatPercentage(pledged, goal)} terdanai
                </p>
              </div>

              {/* Campaign Stats */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Mulai:</span>
                  <span className="font-medium text-sm">{formatDate(campaign.startAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Tenggat Waktu:</span>
                  <span className="font-medium text-sm">{formatDate(campaign.endAt)}</span>
                </div>
                {userPledgeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Kontribusi Anda:</span>
                    <span className="font-medium text-sm text-crypto-blue">{formatCurrency(userPledgeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Status:</span>
                  <span className={`font-medium text-sm ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
              </div>
            </div>

            {/* Cancel Campaign (for creator, before start, not cancelled) */}
            {isConnected && isCreator && isUpcoming && !isCancelled && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kelola Kampanye</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Kampanye belum dimulai. Anda dapat membatalkannya sebelum tanggal mulai.
                </p>
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Batalkan Kampanye
                </button>
              </div>
            )}

            {/* Pledge/Unpledge Section */}
            {isConnected && isActive && !isCancelled && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {userPledgeAmount > 0 ? 'Kelola Kontribusi Anda' : 'Dukung Kampanye Ini'}
                </h3>

                {userPledgeAmount > 0 && (
                  <div className="mb-4 p-3 bg-crypto-light-blue rounded-lg">
                    <p className="text-sm text-crypto-blue">
                      Anda telah berkontribusi sebesar {formatCurrency(userPledgeAmount)} untuk kampanye ini
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Pledge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Kontribusi (ETH)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(e.target.value)}
                        placeholder="0.01"
                        min="0.001"
                        step="0.001"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePledge}
                    disabled={!pledgeAmount || parseFloat(pledgeAmount) <= 0}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {userPledgeAmount > 0 ? 'Tambah Kontribusi' : 'Kontribusi Sekarang'}
                  </button>

                  {/* Unpledge */}
                  {userPledgeAmount > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jumlah Tarik (ETH)
                        </label>
                        <div className="relative">
                          <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={unpledgeAmount}
                            onChange={(e) => setUnpledgeAmount(e.target.value)}
                            placeholder={formatWeiToEth(userPledge)}
                            min="0.001"
                            step="0.001"
                            max={formatWeiToEth(userPledge)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleUnpledge}
                        className="w-full btn-secondary"
                      >
                        Tarik Kontribusi
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Claim/Refund Section */}
            {hasEnded && isConnected && !isCancelled && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isClaimed ? 'Dana Telah Dicairkan' : goalReached ? 'Kampanye Berhasil' : 'Kampanye Gagal'}
                </h3>
                
                {isClaimed ? (
                  <p className="text-purple-600 text-sm">
                    Dana kampanye telah berhasil dicairkan oleh pembuat kampanye.
                  </p>
                ) : goalReached ? (
                  isCreator && !campaign.claimed ? (
                    <button
                      onClick={handleClaim}
                      className="w-full btn-primary"
                    >
                      Cairkan Dana
                    </button>
                  ) : (
                    <p className="text-green-600 text-sm">
                      Kampanye berhasil! Pembuat kampanye dapat mencairkan dana.
                    </p>
                  )
                ) : (
                  userPledgeAmount > 0 ? (
                    <button
                      onClick={handleRefund}
                      className="w-full btn-secondary"
                    >
                      Minta Pengembalian Dana
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Target kampanye tidak tercapai. Kontributor dapat meminta pengembalian dana.
                    </p>
                  )
                )}
              </div>
            )}

            {/* Connect Wallet CTA */}
            {!isConnected && isActive && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hubungkan Wallet Anda
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Hubungkan wallet untuk mendukung kampanye ini
                </p>
                <div className="flex justify-center">
                  <WalletConnect className="w-full justify-center" />
                </div>
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
        message={txStatus.message}
      />
    </div>
  );
};

export default CampaignDetail;
