import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { validateCampaignForm } from '../utils/validation';
import { uploadToIPFS, uploadImageToIPFS, createCampaignMetadata } from '../utils/ipfs';
import { getExplorerUrl } from '../utils/network';
import { useTranslation } from '../i18n';
import TransactionStatus from '../components/TransactionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import WalletConnect from '../components/WalletConnect';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isConnected, chainId, signer, account } = useWallet();
  const { createCampaign } = useContract(signer, account);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    startAt: '',
    endAt: '',
    imageUrl: ''
  });
  
  const [startNow, setStartNow] = useState(true); // Default: start immediately
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState({
    isOpen: false,
    status: 'pending',
    hash: null
  });

  // Tetapkan tanggal default
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setFormData(prev => ({
      ...prev,
      startAt: tomorrow.toISOString().split('T')[0],
      endAt: nextWeek.toISOString().split('T')[0]
    }));
  }, []);

  // Periksa apakah pengguna telah terhubung
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-crypto-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="w-8 h-8 text-crypto-blue" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('create.wallet_required_title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('create.wallet_required_desc')}
          </p>
          <div className="flex justify-center">
            <WalletConnect className="w-full justify-center" />
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Silakan pilih file gambar yang valid'
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Ukuran file gambar harus kurang dari 5MB'
        }));
        return;
      }

      setImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    console.log('Memulai pembuatan kampanye...', { formData, startNow, isConnected: isConnected });

    // Skip startAt validation if starting immediately
    const formToValidate = startNow
      ? { ...formData, startAt: new Date().toISOString().split('T')[0] }
      : formData;
    const validationErrors = validateCampaignForm(formToValidate);
    // Remove startAt error if starting immediately
    if (startNow) {
      delete validationErrors.startAt;
    }
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validasi formulir gagal:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setTxStatus({
      isOpen: true,
      status: 'pending',
      hash: null
    });

    try {
      // V2 contract: if startAt = 0, campaign starts immediately (block.timestamp)
      const startAtTimestamp = startNow ? 0 : Math.floor(new Date(formData.startAt).getTime() / 1000);
      const endAtTimestamp = Math.floor(new Date(formData.endAt).getTime() / 1000);
      
      let metadata = {};
      let imageCid = null;
      
      console.log('Parameter kampanye:', {
        goal: formData.goal,
        startAt: startAtTimestamp,
        endAt: endAtTimestamp
      });
      
      if (imageFile) {
        setUploadingToIPFS(true);
        try {
          console.log('Mengunggah gambar ke IPFS...');
          imageCid = await uploadImageToIPFS(imageFile);
          console.log('Gambar berhasil diunggah:', imageCid);
        } catch (error) {
          console.error('Error mengunggah gambar ke IPFS:', error);
          throw new Error(`Gagal mengunggah gambar ke IPFS: ${error.message}`);
        } finally {
          setUploadingToIPFS(false);
        }
      }
      
      metadata = createCampaignMetadata(formData, imageCid);
      console.log('Metadata dibuat:', metadata);
      
      try {
        console.log('Mengunggah metadata ke IPFS...');
        const metadataCid = await uploadToIPFS(metadata);
        console.log('Metadata berhasil diunggah:', metadataCid);
        
        console.log('Memanggil contract.createCampaign...');
        const result = await createCampaign(
          formData.goal,
          startAtTimestamp,
          endAtTimestamp,
          metadataCid
        );
        
        console.log('Hasil pemanggilan kontrak:', result);
        
        if (result && result.hash) {
          setTxStatus({
            isOpen: true,
            status: 'success',
            hash: result.hash
          });

          console.log('Kampanye berhasil dibuat!');

          // Redirect to transaction detail page
          setTimeout(() => {
            navigate(`/tx/${result.hash}`);
          }, 1500);
        } else {
          throw new Error('Transaksi selesai tetapi tidak ada hash yang diterima');
        }
      } catch (error) {
        console.error('Error mengunggah metadata ke IPFS:', error);
        throw new Error(`Gagal mengunggah metadata kampanye ke IPFS: ${error.message}`);
      }
    } catch (error) {
      console.error('Error membuat kampanye:', error);
      setTxStatus({
        isOpen: true,
        status: 'error',
        hash: null,
        message: error.message || 'Gagal membuat kampanye'
      });
    } finally {
      setIsSubmitting(false);
      setUploadingToIPFS(false);
    }
  };

  const handleRetry = () => {
    setTxStatus({
      isOpen: false,
      status: 'pending',
      hash: null
    });
    handleSubmit(new Event('submit'));
  };

  const handleClose = () => {
    setTxStatus({
      isOpen: false,
      status: 'pending',
      hash: null
    });
  };

  const viewOnExplorer = (hash) => {
    const explorerUrl = getExplorerUrl(chainId, 'tx', hash);
    window.open(explorerUrl, '_blank');
  };

  const today = new Date().toISOString().split('T')[0];
  const minStartDate = today;
  const minEndDate = formData.startAt || today;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('create.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('create.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Judul Kampanye */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                {t('create.campaign_title_label')}
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('create.campaign_title_placeholder')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Deskripsi Kampanye */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                {t('create.description_label')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder={t('create.description_placeholder')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Target Pendanaan */}
            <div className="mb-6">
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                {t('create.goal_label')}
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="0.1"
                  min="0.001"
                  step="0.001"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                    errors.goal ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.goal && (
                <p className="mt-1 text-sm text-red-600">{errors.goal}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {t('create.goal_min_hint')}
              </p>
            </div>

            {/* Tanggal Mulai */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Mulai Kampanye *
              </label>
              
              {/* Start Now Toggle */}
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="startNow"
                  checked={startNow}
                  onChange={(e) => setStartNow(e.target.checked)}
                  className="h-4 w-4 text-crypto-blue focus:ring-crypto-blue border-gray-300 rounded"
                />
                <label htmlFor="startNow" className="ml-2 block text-sm text-gray-700">
                  Mulai sekarang (langsung menerima kontribusi)
                </label>
              </div>

              {!startNow && (
                <>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="startAt"
                      name="startAt"
                      value={formData.startAt}
                      onChange={handleInputChange}
                      min={minStartDate}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                        errors.startAt ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.startAt && (
                    <p className="mt-1 text-sm text-red-600">{errors.startAt}</p>
                  )}
                </>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {startNow
                  ? 'Kampanye akan langsung aktif dan menerima kontribusi setelah dibuat'
                  : 'Tanggal kampanye Anda mulai menerima kontribusi'
                }
              </p>
            </div>

            {/* Tanggal Selesai */}
            <div className="mb-6">
              <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai Kampanye *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  id="endAt"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleInputChange}
                  min={minEndDate}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                    errors.endAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.endAt && (
                <p className="mt-1 text-sm text-red-600">{errors.endAt}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Durasi kampanye harus antara 1 hari hingga 90 hari
              </p>
            </div>

            {/* Unggah Gambar */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gambar Kampanye
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Pratinjau gambar kampanye"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Unggah gambar kampanye
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PNG, JPG, GIF hingga 5MB
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">
                        Rasio 16:9 • Ukuran ideal: 1200×675px (min 800×450px)
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </div>
                </div>
              )}
              
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Panduan Kampanye */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Panduan Kampanye
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Kampanye harus memiliki target yang jelas dan dapat dicapai</li>
                <li>• Bersikap transparan tentang bagaimana dana akan digunakan</li>
                <li>• Berikan pembaruan rutin kepada para pendukung</li>
                <li>• Dana hanya dicairkan jika target tercapai</li>
                <li>• Semua transaksi dicatat di blockchain</li>
              </ul>
            </div>

            {/* Tombol Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Batal
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || uploadingToIPFS}
                className="btn-primary flex-1 relative"
              >
                {isSubmitting || uploadingToIPFS ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" color="text-white" />
                    <span className="ml-2">
                      {uploadingToIPFS ? 'Mengunggah ke IPFS...' : 'Membuat Kampanye...'}
                    </span>
                  </div>
                ) : (
                  'Buat Kampanye'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Status Transaksi */}
        <TransactionStatus
          isOpen={txStatus.isOpen}
          onClose={handleClose}
          status={txStatus.status}
          hash={txStatus.hash}
          onRetry={txStatus.status === 'error' ? handleRetry : null}
          onViewOnExplorer={viewOnExplorer}
          message={txStatus.message}
        />
      </div>
    </div>
  );
};

export default CreateCampaign;
