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
      title: 'Pendanaan Transparan',
      description: 'Semua transaksi dicatat di blockchain, memastikan transparansi dan akuntabilitas yang lengkap.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Aman & Tanpa Perantara',
      description: 'Smart contract mengelola dana secara otomatis. Tidak ada pihak ketiga yang dapat ikut campur.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Akses Global',
      description: 'Siapa pun, di mana pun, dapat membuat atau mendukung kampanye menggunakan wallet kripto mereka.'
    },
    {
      icon: UserGroupIcon,
      title: 'Berbasis Komunitas',
      description: 'Danai proyek yang berarti bagi Anda. Setiap kontribusi membantu mewujudkan ide menjadi kenyataan.'
    },
    {
      icon: TrophyIcon,
      title: 'Tanpa Biaya Keberhasilan',
      description: 'Kami tidak mengambil potongan dari kampanye yang berhasil. Dana Anda langsung disalurkan ke pembuat kampanye.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Pencairan Instan',
      description: 'Dana otomatis didistribusikan ketika target kampanye tercapai.'
    }
  ];

  const stats = [
    { label: 'Kampanye Didanai', value: '1.200+' },
    { label: 'Total Volume', value: '$2,5 Juta+' },
    { label: 'Tingkat Keberhasilan', value: '94%' },
    { label: 'Anggota Komunitas', value: '15.000+' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Memuat OpenFund..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Bagian Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-crypto-light-blue to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Wujudkan Ide Anda dengan{' '}
              <span className="text-crypto-blue">Dukungan Komunitas</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Platform crowdfunding terdesentralisasi yang dibangun di atas Base.
              Buat kampanye, kumpulkan dukungan komunitas, dan wujudkan ide Anda
              dengan transparansi serta keamanan penuh.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isConnected ? (
                <Link
                  to="/campaigns"
                  className="btn-primary text-lg px-8 py-3"
                >
                  Jelajahi Kampanye
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <WalletConnect className="text-lg px-8 py-3" />
                  <Link
                    to="/campaigns"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    Lihat Kampanye
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Efek Latar Belakang */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-crypto-blue/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Bagian Statistik */}
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

      {/* Bagian Fitur Unggulan */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Mengapa Memilih OpenFund?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Rasakan masa depan crowdfunding dengan teknologi blockchain
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

      {/* Cara Kerja */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Cara Kerja OpenFund
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Crowdfunding yang sederhana, aman, dan transparan dalam tiga langkah
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Buat Kampanye
              </h3>
              <p className="text-gray-600">
                Tetapkan target pendanaan, tenggat waktu, dan detail kampanye Anda.
                Tidak memerlukan proses persetujuan.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Kumpulkan Dukungan
              </h3>
              <p className="text-gray-600">
                Bagikan kampanye Anda kepada komunitas.
                Pendukung berkontribusi menggunakan wallet kripto mereka.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-crypto-blue text-white rounded-full text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Terima Dana
              </h3>
              <p className="text-gray-600">
                Ketika target tercapai, dana secara otomatis
                dikirim ke wallet pembuat kampanye.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian CTA */}
      <section className="py-20 bg-crypto-blue">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Siap Memulai Kampanye Anda?
          </h2>
          <p className="mt-4 text-lg text-crypto-light-blue">
            Bergabunglah dengan ribuan kreator yang telah berhasil mendanai proyek mereka
          </p>
          <div className="mt-8 flex justify-center">
            {isConnected ? (
              <Link
                to="/create"
                className="bg-white text-crypto-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Buat Kampanye
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
