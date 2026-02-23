import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import CampaignCard from '../components/CampaignCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { address: _address, isConnected: _isConnected } = useWallet();
  const { 
    campaigns,
    userContributions,
    isLoading,
    fetchCampaigns
  } = useContract();
  
  const handleRefresh = useCallback(async () => {
    console.log('HomePage: Manual refresh triggered');
    await fetchCampaigns();
  }, [fetchCampaigns]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Current timestamp (static for now to avoid impure function issues)
  const NOW_TIMESTAMP = 1735717205; // Static timestamp

  // Filter campaigns based on search term, status, and sort
  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      // For search, we'll use the campaign ID as fallback since metadata is loaded by individual CampaignCard components
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return campaign.id.toString().includes(searchLower) || 
               campaign.creator.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(campaign => {
      // Status filter
      switch (filterStatus) {
        case 'active':
          return NOW_TIMESTAMP >= campaign.startAt && NOW_TIMESTAMP <= campaign.endAt;
        case 'successful':
          return BigInt(campaign.pledged) >= BigInt(campaign.goal);
        case 'failed':
          return NOW_TIMESTAMP > campaign.endAt && BigInt(campaign.pledged) < BigInt(campaign.goal);
        case 'upcoming':
          return NOW_TIMESTAMP < campaign.startAt;
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
          return BigInt(b.pledged) - BigInt(a.pledged);
        default:
          return 0;
      }
    });

  const featuredCampaigns = campaigns.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading campaigns..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Campaigns Section */}
      {featuredCampaigns.length > 0 && (
        <section className="bg-white border-b border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 mb-8">
              <SparklesIcon className="w-6 h-6 text-crypto-blue" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Campaigns</h2>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Campaigns</h1>
              <p className="text-gray-600">
                Support innovative projects and bring ideas to life
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/create"
                className="btn-primary"
              >
                Create Campaign
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
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent appearance-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="most-funded">Most Funded</option>
                  <option value="goal-reached">Goal Reached</option>
                </select>
              </div>

              {/* Filter Status */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent appearance-none"
                >
                  <option value="all">All Campaigns</option>
                  <option value="active">Active</option>
                  <option value="successful">Successful</option>
                  <option value="failed">Failed</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-end">
                <span className="text-sm text-gray-600">
                  {filteredAndSortedCampaigns.length} campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>

          {/* Campaign Grid */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('newest');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
