import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { CAMPAIGN_STATUS } from '../constants';
import { getCampaignStatusLocal } from '../utils/validation';
import { useTranslation } from '../i18n';
import CampaignCard from '../components/CampaignCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { t } = useTranslation();
  const { signer, account, isConnected } = useWallet();
  // useContract now works without wallet (read-only mode via public RPC)
  const { 
    campaigns,
    userContributions,
    isLoading,
    fetchCampaigns
  } = useContract(signer, account);
  
  const handleRefresh = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter campaigns based on search, status, and sort
  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return campaign.id.toString().includes(searchLower) || 
               campaign.creator.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(campaign => {
      const status = getCampaignStatusLocal(campaign);
      switch (filterStatus) {
        case 'active':
          return status === CAMPAIGN_STATUS.ACTIVE;
        case 'successful':
          return status === CAMPAIGN_STATUS.SUCCESSFUL || status === CAMPAIGN_STATUS.CLAIMED;
        case 'failed':
          return status === CAMPAIGN_STATUS.FAILED;
        case 'upcoming':
          return status === CAMPAIGN_STATUS.UPCOMING;
        case 'cancelled':
          return status === CAMPAIGN_STATUS.CANCELLED;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      if (sortBy === 'goal-reached') {
        const aReached = BigInt(a.pledged) >= BigInt(a.goal);
        const bReached = BigInt(b.pledged) >= BigInt(b.goal);
        return (bReached ? 1 : 0) - (aReached ? 1 : 0);
      }
      
      switch (sortBy) {
        case 'newest':
          return parseInt(b.id) - parseInt(a.id);
        case 'ending-soon':
          return a.endAt - b.endAt;
        case 'most-funded':
          return Number(BigInt(b.pledged) - BigInt(a.pledged));
        default:
          return 0;
      }
    });

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('home.loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('home.discover')}</h1>
              <p className="text-gray-600">
                {t('home.discover_description')}
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('home.refresh')}
              </button>
              {isConnected && (
                <Link
                  to="/create"
                  className="btn-primary"
                >
                  {t('home.create_campaign')}
                </Link>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('home.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent appearance-none"
                >
                  <option value="newest">{t('home.sort_newest')}</option>
                  <option value="ending-soon">{t('home.sort_ending_soon')}</option>
                  <option value="most-funded">{t('home.sort_most_funded')}</option>
                  <option value="goal-reached">{t('home.sort_goal_reached')}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent appearance-none"
                >
                  <option value="all">{t('home.filter_all')}</option>
                  <option value="active">{t('home.filter_active')}</option>
                  <option value="successful">{t('home.filter_successful')}</option>
                  <option value="failed">{t('home.filter_failed')}</option>
                  <option value="upcoming">{t('home.filter_upcoming')}</option>
                  <option value="cancelled">{t('home.filter_cancelled')}</option>
                </select>
              </div>

              {/* Result Count */}
              <div className="flex items-center justify-end">
                <span className="text-sm text-gray-600">
                  {filteredAndSortedCampaigns.length} {t('home.campaigns_found')}
                </span>
              </div>
            </div>
          </div>

          {/* Campaign List */}
          {filteredAndSortedCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedCampaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  userPledge={userContributions[campaign.id] || '0'}
                  isConnected={isConnected}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FunnelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('home.no_campaigns_title')}</h3>
              <p className="text-gray-600 mb-4">
                {t('home.no_campaigns_description')}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }}
                className="btn-secondary"
              >
                {t('home.clear_filters')}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
