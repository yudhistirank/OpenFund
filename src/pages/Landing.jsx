import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import WalletConnect from '../components/WalletConnect';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
  const { isConnected, isLoading } = useWallet();

  const features = [
    {
      icon: SparklesIcon,
      title: 'Transparent Funding',
      description: 'All transactions are recorded on the blockchain, ensuring complete transparency and accountability.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Trustless',
      description: 'Smart contracts handle fund management automatically. No central authority can interfere.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Access',
      description: 'Anyone, anywhere can create or support campaigns using their cryptocurrency wallet.'
    },
    {
      icon: UserGroupIcon,
      title: 'Community Driven',
      description: 'Fund projects that matter to you. Every contribution helps bring ideas to life.'
    },
    {
      icon: TrophyIcon,
      title: 'No Success Fees',
      description: 'We don\'t take a cut from successful campaigns. Your funds go directly to creators.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Instant Settlements',
      description: 'Funds are automatically distributed when campaign goals are reached.'
    }
  ];

  const stats = [
    { label: 'Campaigns Funded', value: '1,200+' },
    { label: 'Total Volume', value: '$2.5M+' },
    { label: 'Success Rate', value: '94%' },
    { label: 'Community Members', value: '15,000+' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading OpenFund..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-crypto-light-blue to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Fund Your Ideas with{' '}
              <span className="text-crypto-blue">Community</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              The decentralized crowdfunding platform built on Base. 
              Create campaigns, gather community support, and bring your ideas to life 
              with complete transparency and security.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isConnected ? (
                <Link
                  to="/campaigns"
                  className="btn-primary text-lg px-8 py-3"
                >
                  Explore Campaigns
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <WalletConnect className="text-lg px-8 py-3" />
                  <Link
                    to="/campaigns"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    Browse Campaigns
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-crypto-blue">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose OpenFund?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Experience the future of crowdfunding with blockchain technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card group">
                  <div className="flex items-center justify-center w-12 h-12 bg-crypto-light-blue rounded-lg mb-4 group-hover:bg-crypto-blue transition-colors">
                    <Icon className="w-6 h-6 text-crypto-blue group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, secure, and transparent crowdfunding in three steps
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Campaign
              </h3>
              <p className="text-gray-600">
                Set your funding goal, deadline, and campaign details. 
                No approval process needed.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gather Support
              </h3>
              <p className="text-gray-600">
                Share your campaign with the community. 
                Supporters contribute using their cryptocurrency wallets.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Funded
              </h3>
              <p className="text-gray-600">
                When the goal is reached, funds are automatically 
                released to the creator's wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-crypto-blue">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Start Your Campaign?
          </h2>
          <p className="mt-4 text-lg text-crypto-light-blue">
            Join thousands of creators who have successfully funded their projects
          </p>
          <div className="mt-8 flex justify-center">
            {isConnected ? (
              <Link
                to="/create"
                className="bg-white text-crypto-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Create Campaign
              </Link>
            ) : (
              <WalletConnect className="bg-white text-crypto-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" />
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;