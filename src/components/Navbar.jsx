import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import { useWallet } from '../hooks/useWallet';
import { useTranslation } from '../i18n';
import { 
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  HomeIcon,
  PlusCircleIcon,
  UserIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isConnected } = useWallet();
  const { t, language, setLanguage, languages, languageNames } = useTranslation();

  const navigation = [
    { name: t('navbar.home'), href: '/', icon: HomeIcon },
    { name: t('navbar.explore'), href: '/campaigns', icon: ChartBarIcon },
    { name: t('navbar.create_campaign'), href: '/create', icon: PlusCircleIcon },
    { name: t('navbar.dashboard'), href: '/dashboard', icon: UserIcon, requiresAuth: true },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-crypto-blue rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OpenFund</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              if (item.requiresAuth && !isConnected) return null;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-crypto-blue text-white'
                      : 'text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Language Switch + Wallet Connect */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue transition-colors border border-gray-200"
              title={languageNames[language]}
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
            <WalletConnect />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-crypto-blue p-2"
              aria-label={isMenuOpen ? t('navbar.close_menu') : t('navbar.open_menu')}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navigation.map((item) => {
                const Icon = item.icon;
                if (item.requiresAuth && !isConnected) return null;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-crypto-blue text-white'
                        : 'text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-crypto-blue hover:bg-crypto-light-blue transition-colors w-full"
              >
                <GlobeAltIcon className="w-5 h-5" />
                <span>{languageNames[language]}</span>
              </button>
              
              {/* Mobile Wallet Connect */}
              <div className="pt-4 border-t border-gray-100">
                <WalletConnect className="w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
