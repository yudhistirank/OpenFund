import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { CAMPAIGN_STATUS } from '../constants';
import { getCampaignStatusLocal } from '../utils/validation';
import CampaignCard from '../components/CampaignCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { signer, account } = useWallet();
  const { 
    campaigns,
    userContributions,
    isLoading,
    fetchCampaigns
  } = useContract(signer, account);
  
  const handleRefresh = useCallback(async () => {
    console.log('HomePage: Manual refresh triggered');
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

  const featuredCampaigns = campaigns
    .filter(c => getCampaignStatusLocal(c) !== CAMPAIGN_STATUS.CANCELLED)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Memuat kampanye..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Campaigns */}
      {featuredCampaigns.length > 0 && (
        <section className="bg-white border-b border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 mb-8">
              <SparklesIcon className="w-6 h-6 text-crypto-blue" />
              <h2 className="text-2xl font-bold text-gray-900">Kampanye Unggulan</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCampaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  userPledge={userContributions[campaign.id] || '0'}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Temukan Kampanye</h1>
              <p className="text-gray-600">
                Dukung proyek inovatif dan wujudkan ide menjadi kenyataan
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Perbarui
              </button>
              <Link
                to="/create"
                className="btn-primary"
              >
                Buat Kampanye
              </Link>
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
                  placeholder="Cari kampanye..."
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
                  <option value="newest">Terbaru</option>
                  <option value="ending-soon">Segera Berakhir</option>
                  <option value="most-funded">Paling Banyak Didanai</option>
                  <option value="goal-reached">Target Tercapai</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent appearance-none"
                >
                  <option value="all">Semua Kampanye</option>
                  <option value="active">Aktif</option>
                  <option value="successful">Berhasil</option>
                  <option value="failed">Gagal</option>
                  <option value="upcoming">Akan Datang</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              {/* Result Count */}
              <div className="flex items-center justify-end">
                <span className="text-sm text-gray-600">
                  {filteredAndSortedCampaigns.length} kampanye ditemukan
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FunnelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kampanye ditemukan</h3>
              <p className="text-gray-600 mb-4">
                Coba sesuaikan kata kunci pencarian atau kriteria filter Anda
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }}
                className="btn-secondary"
              >
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
