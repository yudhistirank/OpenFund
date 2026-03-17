import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { CAMPAIGN_STATUS } from '../constants';
import { useTranslation } from '../i18n';
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
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const { t } = useTranslation();
  const { account, signer } = useWallet();
  const {
    campaigns,
    userCampaigns,
    userContributions,
    isLoading,
  } = useContract(signer, account);

  const [activeTab, setActiveTab] = useState('overview');

  // Compute stats from campaigns and contributions
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

  // Get campaigns where user contributed
  const contributedCampaigns = campaigns.filter(c => userContributions[c.id]);

  const getStatusBadge = (campaign) => {
    const status = getCampaignStatusLocal(campaign);
    
    switch (status) {
      case CAMPAIGN_STATUS.CANCELLED:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <NoSymbolIcon className="w-3 h-3 mr-1" />
            Dibatalkan
          </span>
        );
      case CAMPAIGN_STATUS.CLAIMED:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Dicairkan
          </span>
        );
      case CAMPAIGN_STATUS.SUCCESSFUL:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Berhasil
          </span>
        );
      case CAMPAIGN_STATUS.FAILED:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Gagal
          </span>
        );
      case CAMPAIGN_STATUS.ACTIVE:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-crypto-light-blue text-crypto-blue">
            <ClockIcon className="w-3 h-3 mr-1" />
            Aktif
          </span>
        );
      case CAMPAIGN_STATUS.UPCOMING:
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Akan Datang
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">
            {t('dashboard.welcome')}
          </p>
          {account && (
            <p className="text-sm text-gray-400 mt-1">
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-2 overflow-x-auto pb-1">
            {[
              { id: 'overview', name: 'Ringkasan', icon: ChartBarIcon },
              { id: 'campaigns', name: 'Kampanye Saya', icon: GiftIcon },
              { id: 'contributions', name: 'Kontribusi Saya', icon: HeartIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-crypto-blue text-white'
                      : 'text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GiftIcon className="h-8 w-8 text-crypto-blue" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kampanye Dibuat</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCreated}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <HeartIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Kontribusi</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalContributed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Jumlah</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Kampanye Berhasil</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.successfulCampaigns}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent campaigns */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kampanye Terbaru Anda</h3>
              {userCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {userCampaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Kampanye #{campaign.id}</p>
                        <p className="text-xs text-gray-500">
                          Target: {formatCurrency(parseFloat(formatWeiToEth(campaign.goal)))}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(campaign)}
                        <Link
                          to={`/campaign/${campaign.id}`}
                          className="text-xs text-crypto-blue hover:text-crypto-blue-dark"
                        >
                          Lihat
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada kampanye yang dibuat.</p>
              )}
            </div>
          </div>
        )}

        {/* My Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Kampanye Saya</h3>
                <Link to="/create" className="btn-primary">
                  Buat Kampanye Baru
                </Link>
              </div>
            </div>
            <div className="p-6">
              {userCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {userCampaigns.map((campaign) => {
                    const goal = parseFloat(formatWeiToEth(campaign.goal));
                    const pledged = parseFloat(formatWeiToEth(campaign.pledged));
                    const progressPercentage = goal > 0 ? (pledged / goal) * 100 : 0;

                    return (
                      <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              Kampanye #{campaign.id}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Mulai: {formatDate(campaign.startAt)} — Selesai: {formatDate(campaign.endAt)}
                            </p>
                          </div>
                          {getStatusBadge(campaign)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Target</p>
                            <p className="font-semibold">{formatCurrency(goal)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Terkumpul</p>
                            <p className="font-semibold">{formatCurrency(pledged)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Progres</p>
                            <p className="font-semibold">{formatPercentage(pledged, goal)}</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className={`h-2 rounded-full ${
                              progressPercentage >= 100 ? 'bg-green-500' : 'bg-crypto-blue'
                            }`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <Link
                            to={`/campaign/${campaign.id}`}
                            className="btn-primary text-sm"
                          >
                            Lihat Kampanye
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada kampanye</h4>
                  <p className="text-gray-600 mb-4">Buat kampanye pertama Anda untuk mulai</p>
                  <Link to="/create" className="btn-primary">
                    Buat Kampanye
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Kontribusi Saya</h3>
            </div>
            <div className="p-6">
              {contributedCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {contributedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Kampanye #{campaign.id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Tenggat: {formatDate(campaign.endAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-crypto-blue">
                            {formatCurrency(parseFloat(formatWeiToEth(userContributions[campaign.id])))}
                          </p>
                          {getStatusBadge(campaign)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Link
                          to={`/campaign/${campaign.id}`}
                          className="btn-secondary text-sm"
                        >
                          Lihat Kampanye
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada kontribusi</h4>
                  <p className="text-gray-600 mb-4">Mulai dukung kampanye untuk melihatnya di sini</p>
                  <Link to="/campaigns" className="btn-primary">
                    Jelajahi Kampanye
                  </Link>
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
