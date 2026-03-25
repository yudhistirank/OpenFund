import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { CAMPAIGN_STATUS } from '../constants';
import { useTranslation } from '../i18n';
import { fetchFromIPFS } from '../utils/ipfs';
import {
  formatWeiToEth,
  formatDate,
  formatCurrency,
  formatPercentage
} from '../utils/format';
import { getCampaignStatusLocal } from '../utils/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  GiftIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  ArrowUturnLeftIcon,
  ArrowPathIcon,
  SparklesIcon,
  RocketLaunchIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TX_TYPE_ICONS = {
  fund:     BanknotesIcon,
  withdraw: ArrowUturnLeftIcon,
  refund:   ArrowPathIcon,
  claim:    SparklesIcon,
  create:   RocketLaunchIcon,
  cancel:   XMarkIcon,
};

const TX_TYPE_CONFIG = {
  fund:     { label: 'Donasi',          color: 'text-green-600',  bg: 'bg-green-50' },
  withdraw: { label: 'Tarik Donasi',    color: 'text-orange-600', bg: 'bg-orange-50' },
  refund:   { label: 'Refund',          color: 'text-blue-600',   bg: 'bg-blue-50' },
  claim:    { label: 'Cairkan Dana',    color: 'text-purple-600', bg: 'bg-purple-50' },
  create:   { label: 'Buat Kampanye',   color: 'text-crypto-blue',bg: 'bg-crypto-light-blue' },
  cancel:   { label: 'Batal Kampanye',  color: 'text-gray-600',   bg: 'bg-gray-100' },
};

const UserDashboard = () => {
  const { t } = useTranslation();
  const { account, signer } = useWallet();
  const {
    campaigns,
    userCampaigns,
    userContributions,
    isLoading,
    getUserTransactionHistory,
  } = useContract(signer, account);

  const [activeTab, setActiveTab] = useState('overview');
  const [txHistory, setTxHistory] = useState([]);
  const [loadingTxHistory, setLoadingTxHistory] = useState(false);
  const [campaignNames, setCampaignNames] = useState({}); // { campaignId: "name" }

  // Fetch campaign names from IPFS metadata
  useEffect(() => {
    const allCampaigns = [...new Set([...userCampaigns, ...campaigns.filter(c => userContributions[c.id])])];
    allCampaigns.forEach(async (campaign) => {
      if (campaign.metadata && !campaignNames[campaign.id]) {
        try {
          const meta = await fetchFromIPFS(campaign.metadata);
          if (meta?.title) {
            setCampaignNames(prev => ({ ...prev, [campaign.id]: meta.title }));
          }
        } catch {
          // ignore metadata fetch errors
        }
      }
    });
  }, [userCampaigns, campaigns, userContributions]);

  const getCampaignName = useCallback((id) => {
    return campaignNames[id] || t('common.campaign_hash', { id });
  }, [campaignNames, t]);

  useEffect(() => {
    if (activeTab === 'history' && account && getUserTransactionHistory) {
      loadTransactionHistory();
    }
  }, [activeTab, account]);

  const loadTransactionHistory = async () => {
    try {
      setLoadingTxHistory(true);
      const history = await getUserTransactionHistory();
      setTxHistory(history);
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoadingTxHistory(false);
    }
  };

  const stats = {
    totalCreated: userCampaigns.length,
    totalContributed: Object.keys(userContributions).length,
    totalAmount: Object.values(userContributions).reduce(
      (sum, amount) => sum + parseFloat(formatWeiToEth(amount)), 0
    ),
    successfulCampaigns: userCampaigns.filter(campaign => {
      const status = getCampaignStatusLocal(campaign);
      return status === CAMPAIGN_STATUS.SUCCESSFUL || status === CAMPAIGN_STATUS.CLAIMED;
    }).length,
  };

  const contributedCampaigns = campaigns.filter(c => userContributions[c.id]);

  const getStatusBadge = (campaign) => {
    const status = getCampaignStatusLocal(campaign);
    const statusConfig = {
      [CAMPAIGN_STATUS.CANCELLED]:  { icon: NoSymbolIcon,    text: t('status.cancelled'),  cls: 'bg-gray-100 text-gray-800' },
      [CAMPAIGN_STATUS.CLAIMED]:    { icon: CheckCircleIcon, text: t('status.claimed'),     cls: 'bg-purple-100 text-purple-800' },
      [CAMPAIGN_STATUS.SUCCESSFUL]: { icon: CheckCircleIcon, text: t('status.successful'),  cls: 'bg-green-100 text-green-800' },
      [CAMPAIGN_STATUS.FAILED]:     { icon: XCircleIcon,     text: t('status.failed'),      cls: 'bg-red-100 text-red-800' },
      [CAMPAIGN_STATUS.ACTIVE]:     { icon: ClockIcon,       text: t('status.active'),      cls: 'bg-crypto-light-blue text-crypto-blue' },
      [CAMPAIGN_STATUS.UPCOMING]:   { icon: ClockIcon,       text: t('status.upcoming'),    cls: 'bg-orange-100 text-orange-800' },
    };
    const cfg = statusConfig[status] || statusConfig[CAMPAIGN_STATUS.UPCOMING];
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
        <Icon className="w-3 h-3 mr-1" />{cfg.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('dashboard.loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.welcome')}</p>
          {account && <p className="text-sm text-gray-400 mt-1">{account.slice(0, 6)}...{account.slice(-4)}</p>}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-2 overflow-x-auto pb-1">
            {[
              { id: 'overview', name: t('dashboard.tab_overview'), icon: ChartBarIcon },
              { id: 'campaigns', name: t('dashboard.tab_campaigns'), icon: GiftIcon },
              { id: 'contributions', name: t('dashboard.tab_contributions'), icon: HeartIcon },
              { id: 'history', name: 'Riwayat Transaksi', icon: DocumentTextIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-crypto-blue text-white' : 'text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue'
                  }`}>
                  <Icon className="w-4 h-4" /><span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: GiftIcon,            color: 'text-crypto-blue', label: t('dashboard.stat_campaigns_created'), value: stats.totalCreated },
                { icon: HeartIcon,           color: 'text-red-500',     label: t('dashboard.stat_total_contributions'), value: stats.totalContributed },
                { icon: CurrencyDollarIcon,  color: 'text-green-500',   label: t('dashboard.stat_total_amount'), value: formatCurrency(stats.totalAmount) },
                { icon: ArrowTrendingUpIcon, color: 'text-green-500',   label: t('dashboard.stat_successful_campaigns'), value: stats.successfulCampaigns },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <Icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recent_campaigns')}</h3>
              {userCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {userCampaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getCampaignName(campaign.id)}</p>
                        <p className="text-xs text-gray-500">{t('common.goal')}: {formatCurrency(parseFloat(formatWeiToEth(campaign.goal)))}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(campaign)}
                        <Link to={`/campaign/${campaign.id}`} className="text-xs text-crypto-blue">{t('common.view')}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t('dashboard.no_campaigns_created')}</p>
              )}
            </div>
          </div>
        )}

        {/* My Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.my_campaigns_header')}</h3>
              <Link to="/create" className="btn-primary">{t('dashboard.create_new_campaign')}</Link>
            </div>
            <div className="p-6">
              {userCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {userCampaigns.map((campaign) => {
                    const goal = parseFloat(formatWeiToEth(campaign.goal));
                    const pledged = parseFloat(formatWeiToEth(campaign.pledged));
                    const pct = goal > 0 ? (pledged / goal) * 100 : 0;
                    return (
                      <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{getCampaignName(campaign.id)}</h4>
                            <p className="text-sm text-gray-600 mt-1">{formatDate(campaign.startAt)} — {formatDate(campaign.endAt)}</p>
                          </div>
                          {getStatusBadge(campaign)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div><p className="text-sm text-gray-500">{t('common.goal')}</p><p className="font-semibold">{formatCurrency(goal)}</p></div>
                          <div><p className="text-sm text-gray-500">{t('common.collected')}</p><p className="font-semibold">{formatCurrency(pledged)}</p></div>
                          <div><p className="text-sm text-gray-500">{t('common.progress')}</p><p className="font-semibold">{formatPercentage(pledged, goal)}</p></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-crypto-blue'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <Link to={`/campaign/${campaign.id}`} className="btn-primary text-sm">{t('dashboard.view_campaign')}</Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.no_campaigns_title')}</h4>
                  <p className="text-gray-600 mb-4">{t('dashboard.no_campaigns_desc')}</p>
                  <Link to="/create" className="btn-primary">{t('dashboard.create_campaign')}</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.my_contributions_header')}</h3>
            </div>
            <div className="p-6">
              {contributedCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {contributedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{getCampaignName(campaign.id)}</h4>
                          <p className="text-sm text-gray-600">{t('common.deadline')}: {formatDate(campaign.endAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-crypto-blue">{formatCurrency(parseFloat(formatWeiToEth(userContributions[campaign.id])))}</p>
                          {getStatusBadge(campaign)}
                        </div>
                      </div>
                      <Link to={`/campaign/${campaign.id}`} className="btn-secondary text-sm">{t('dashboard.view_campaign')}</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.no_contributions_title')}</h4>
                  <p className="text-gray-600 mb-4">{t('dashboard.no_contributions_desc')}</p>
                  <Link to="/campaigns" className="btn-primary">{t('dashboard.explore_campaigns')}</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Riwayat Transaksi
                </h3>
                <button onClick={loadTransactionHistory} disabled={loadingTxHistory} className="btn-secondary text-sm">
                  {loadingTxHistory ? 'Memuat...' : 'Perbarui'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Data diambil dari blockchain events (on-chain)</p>
            </div>
            <div className="p-6">
              {loadingTxHistory ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="large" text="Memuat riwayat transaksi..." />
                </div>
              ) : txHistory.length > 0 ? (
                <div className="space-y-3">
                  {txHistory.map((tx, index) => {
                    const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.fund;
                    const amountEth = tx.amount !== '0' ? parseFloat(ethers.formatEther(tx.amount)).toFixed(4) : '-';

                    return (
                      <div key={`${tx.txHash}-${index}`} className={`flex items-center justify-between p-4 rounded-lg border ${config.bg} border-gray-100`}>
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const TxIcon = TX_TYPE_ICONS[tx.type] || BanknotesIcon;
                            return (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${config.bg} border border-gray-200`}>
                                <TxIcon className={`w-5 h-5 ${config.color}`} />
                              </div>
                            );
                          })()}
                          <div>
                            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                            <p className="text-xs text-gray-500">
                              {getCampaignName(tx.campaignId)} • Block #{tx.blockNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {amountEth !== '-' && (
                            <span className="text-sm font-bold text-gray-900">{amountEth} ETH</span>
                          )}
                          <Link
                            to={`/tx/${tx.txHash}`}
                            className="flex items-center gap-1 text-xs text-crypto-blue hover:underline"
                            title="View Transaction Detail"
                          >
                            <span className="font-mono">{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</span>
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Transaksi</h4>
                  <p className="text-gray-600">Riwayat transaksi on-chain Anda akan muncul di sini.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
