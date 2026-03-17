import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useTranslation } from '../i18n';
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
  const { t } = useTranslation();

  const features = [
    { icon: SparklesIcon,     title: t('landing.feature_transparent_title'), description: t('landing.feature_transparent_desc') },
    { icon: ShieldCheckIcon,  title: t('landing.feature_secure_title'),      description: t('landing.feature_secure_desc') },
    { icon: GlobeAltIcon,     title: t('landing.feature_global_title'),      description: t('landing.feature_global_desc') },
    { icon: UserGroupIcon,    title: t('landing.feature_community_title'),   description: t('landing.feature_community_desc') },
    { icon: TrophyIcon,       title: t('landing.feature_no_fee_title'),      description: t('landing.feature_no_fee_desc') },
    { icon: CurrencyDollarIcon, title: t('landing.feature_instant_title'),   description: t('landing.feature_instant_desc') },
  ];

  const stats = [
    { label: t('landing.stats_campaigns_funded'),   value: t('landing.stats_campaigns_funded_value') },
    { label: t('landing.stats_total_volume'),        value: t('landing.stats_total_volume_value') },
    { label: t('landing.stats_success_rate'),        value: t('landing.stats_success_rate_value') },
    { label: t('landing.stats_community_members'),   value: t('landing.stats_community_members_value') },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('landing.loading')} />
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
              {t('landing.hero_title')}{' '}
              <span className="text-crypto-blue">{t('landing.hero_title_highlight')}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t('landing.hero_description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isConnected ? (
                <Link to="/campaigns" className="btn-primary text-lg px-8 py-3">
                  {t('landing.explore_campaigns')}
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <WalletConnect className="text-lg px-8 py-3" />
                  <Link to="/campaigns" className="btn-secondary text-lg px-8 py-3">
                    {t('landing.view_campaigns')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Background Effects */}
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
              {t('landing.why_title')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('landing.why_description')}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
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
              {t('landing.how_title')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('landing.how_description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.how_step1_title')}</h3>
              <p className="text-gray-600">{t('landing.how_step1_desc')}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.how_step2_title')}</h3>
              <p className="text-gray-600">{t('landing.how_step2_desc')}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.how_step3_title')}</h3>
              <p className="text-gray-600">{t('landing.how_step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-crypto-blue">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('landing.cta_title')}
          </h2>
          <p className="mt-4 text-lg text-crypto-light-blue">
            {t('landing.cta_description')}
          </p>
          <div className="mt-8 flex justify-center">
            {isConnected ? (
              <Link to="/create" className="bg-white text-crypto-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {t('landing.cta_button')}
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
