import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { 
  formatWeiToEth, 
  formatDate, 
  formatCurrency, 
  formatPercentage 
} from '../utils/format';
import { isCampaignActive, isCampaignEnded, isGoalReached } from '../utils/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const { address, isConnected } = useWallet();
  const { 
    getUserCampaigns, 
    getUserContributions,
    getCampaignById
  } = useContract();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalContributed: 0,
    totalAmount: 0,
    successfulCampaigns: 0,
    totalRefunds: 0
  });
  const [createdCampaigns, setCreatedCampaigns] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserData();
    }
  }, [isConnected, address]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's created campaigns
      const userCampaignIds = await getUserCampaigns(address);
      const userCampaigns = await Promise.all(
        userCampaignIds.map(id => getCampaignById(id))
      );
      setCreatedCampaigns(userCampaigns);

      // Load user's contributions
      const contributionData = await getUserContributions(address);
      setContributions(contributionData);

      // Calculate statistics
      const totalCreated = userCampaigns.length;
      const totalContributed = contributionData.length;
      const totalAmount = contributionData.reduce((sum, contrib) => 
        sum + parseFloat(formatWeiToEth(contrib.amount)), 0
      );
      const successfulCampaigns = userCampaigns.filter(campaign => 
        isGoalReached(campaign)
      ).length;
      const totalRefunds = contributionData.filter(contrib => 
        contrib.refunded
      ).length;

      setStats({
        totalCreated,
        totalContributed,
        totalAmount,
        successfulCampaigns,
        totalRefunds
      });

      // Generate activity feed
      generateActivityFeed(userCampaigns, contributionData);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityFeed = (campaigns, contribs) => {
    const activities = [];

    // Add campaign creation activities
    campaigns.forEach(campaign => {
      activities.push({
        type: 'created',
        title: `Created campaign #${campaign.id}`,
        description: `Goal: ${formatCurrency(parseFloat(formatWeiToEth(campaign.goal)))}`,
        timestamp: campaign.createdAt,
        campaignId: campaign.id
      });
    });

    // Add contribution activities
    contribs.forEach(contrib => {
      activities.push({
        type: 'contributed',
        title: `Contributed to campaign #${contrib.campaignId}`,
        description: `Amount: ${formatCurrency(parseFloat(formatWeiToEth(contrib.amount)))}`,
        timestamp: contrib.timestamp,
        campaignId: contrib.campaignId
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    setActivity(activities.slice(0, 10)); // Show only last 10 activities
  };

  const getStatusBadge = (campaign) => {
    if (isGoalReached(campaign)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Successful
        </span>
      );
    } else if (isCampaignEnded(campaign)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    } else if (isCampaignActive(campaign)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-crypto-light-blue text-crypto-blue">
          <ClockIcon className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <ClockIcon className="w-3 h-3 mr-1" />
          Upcoming
        </span>
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-4">
            You need to connect your wallet to view your dashboard.
          </p>
          <Link to="/" className="btn-primary w-full">
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's your crowdfunding overview.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'campaigns', name: 'My Campaigns', icon: GiftIcon },
              { id: 'contributions', name: 'My Contributions', icon: HeartIcon },
              { id: 'activity', name: 'Activity', icon: ClockIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                    <p className="text-sm font-medium text-gray-600">Campaigns Created</p>
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
                    <p className="text-sm font-medium text-gray-600">Contributions Made</p>
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
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
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
                    <p className="text-sm font-medium text-gray-600">Successful Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.successfulCampaigns}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item.type === 'created' ? 'bg-crypto-blue' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                      <Link
                        to={`/campaign/${item.campaignId}`}
                        className="text-xs text-crypto-blue hover:text-crypto-blue-dark"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent activity.</p>
              )}
            </div>
          </div>
        )}

        {/* My Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Campaigns</h3>
                <Link to="/create" className="btn-primary">
                  Create New Campaign
                </Link>
              </div>
            </div>
            <div className="p-6">
              {createdCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {createdCampaigns.map((campaign) => {
                    const goal = parseFloat(formatWeiToEth(campaign.goal));
                    const pledged = parseFloat(formatWeiToEth(campaign.pledged));
                    const progressPercentage = goal > 0 ? (pledged / goal) * 100 : 0;

                    return (
                      <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              Campaign #{campaign.id}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Created {formatDate(campaign.createdAt)}
                            </p>
                          </div>
                          {getStatusBadge(campaign)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Goal</p>
                            <p className="font-medium">{formatCurrency(goal)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Raised</p>
                            <p className="font-medium">{formatCurrency(pledged)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="font-medium">{formatPercentage(pledged, goal)}</p>
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
                            View Campaign
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h4>
                  <p className="text-gray-600 mb-4">Create your first campaign to get started</p>
                  <Link to="/create" className="btn-primary">
                    Create Campaign
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
              <h3 className="text-lg font-semibold text-gray-900">My Contributions</h3>
            </div>
            <div className="p-6">
              {contributions.length > 0 ? (
                <div className="space-y-4">
                  {contributions.map((contrib, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Campaign #{contrib.campaignId}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Contributed {formatDate(contrib.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-crypto-blue">
                            {formatCurrency(parseFloat(formatWeiToEth(contrib.amount)))}
                          </p>
                          {contrib.refunded && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Refunded
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Link
                          to={`/campaign/${contrib.campaignId}`}
                          className="btn-secondary text-sm"
                        >
                          View Campaign
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No contributions yet</h4>
                  <p className="text-gray-600 mb-4">Start supporting campaigns to see them here</p>
                  <Link to="/campaigns" className="btn-primary">
                    Browse Campaigns
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Feed</h3>
            {activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      item.type === 'created' ? 'bg-crypto-blue' : 'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(item.timestamp)}
                          </p>
                        </div>
                        <Link
                          to={`/campaign/${item.campaignId}`}
                          className="text-xs text-crypto-blue hover:text-crypto-blue-dark"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
                <p className="text-gray-600">Your activity will appear here as you create campaigns and make contributions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;