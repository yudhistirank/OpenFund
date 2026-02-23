import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { validateCampaignForm } from '../utils/validation';
import { uploadToIPFS, uploadImageToIPFS, createCampaignMetadata } from '../utils/ipfs';
import { getExplorerUrl } from '../utils/network';
import TransactionStatus from '../components/TransactionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const CreateCampaign = () => {
  const navigate = useNavigate();
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

  // Set default dates
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

  // Check if user is connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Wallet Connection Required
          </h2>
          <p className="text-gray-600 mb-4">
            You need to connect your wallet to create a campaign.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Go to Home
          </button>
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
    
    // Clear error when user starts typing
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image file size must be less than 5MB'
        }));
        return;
      }

      setImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear any previous image errors
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    console.log('Starting campaign creation...', { formData, isConnected: isConnected });

    // Validate form
    const validationErrors = validateCampaignForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      console.log('Form validation failed:', validationErrors);
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
      // Set startAt and endAt from form data
      const startAtTimestamp = Math.floor(new Date(formData.startAt).getTime() / 1000);
      const endAtTimestamp = Math.floor(new Date(formData.endAt).getTime() / 1000);
      
      let metadata = {};
      let imageCid = null;
      
      console.log('Campaign parameters:', {
        goal: formData.goal,
        startAt: startAtTimestamp,
        endAt: endAtTimestamp
      });
      
      // Upload to IPFS if image file is provided
      if (imageFile) {
        setUploadingToIPFS(true);
        try {
          console.log('Uploading image to IPFS...');
          imageCid = await uploadImageToIPFS(imageFile);
          console.log('Image uploaded successfully:', imageCid);
        } catch (error) {
          console.error('Error uploading image to IPFS:', error);
          throw new Error(`Failed to upload image to IPFS: ${error.message}`);
        } finally {
          setUploadingToIPFS(false);
        }
      }
      
      // Create and upload metadata to IPFS
      metadata = createCampaignMetadata(formData, imageCid);
      console.log('Created metadata:', metadata);
      
      try {
        console.log('Uploading metadata to IPFS...');
        const metadataCid = await uploadToIPFS(metadata);
        console.log('Metadata uploaded successfully:', metadataCid);
        
        // Create campaign with IPFS metadata hash
        console.log('Calling contract.createCampaign...');
        const result = await createCampaign(
          formData.goal, // Pass goal in ETH as string
          startAtTimestamp, // Current timestamp
          endAtTimestamp, // End date timestamp
          metadataCid // IPFS metadata hash
        );
        
        console.log('Contract call result:', result);
        
        if (result && result.hash) {
          setTxStatus({
            isOpen: true,
            status: 'success',
            hash: result.hash
          });

          console.log('Campaign created successfully!');

          // Redirect to campaign detail after a delay
          setTimeout(() => {
            navigate('/campaigns');
          }, 2000);
        } else {
          throw new Error('Transaction completed but no hash received');
        }
      } catch (error) {
        console.error('Error uploading metadata to IPFS:', error);
        throw new Error(`Failed to upload campaign metadata to IPFS: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setTxStatus({
        isOpen: true,
        status: 'error',
        hash: null,
        message: error.message || 'Failed to create campaign'
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

  // Set minimum dates
  const today = new Date().toISOString().split('T')[0];
  const minStartDate = today;
  const minEndDate = formData.startAt || today;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create New Campaign
          </h1>
          <p className="text-lg text-gray-600">
            Launch your crowdfunding campaign and gather community support
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Campaign Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your campaign title"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Campaign Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Describe your campaign, why it matters, and how funds will be used"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Goal Amount */}
            <div className="mb-6">
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                Funding Goal (ETH) *
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
                Minimum goal: 0.01 ETH
              </p>
            </div>

            {/* Campaign Start Date */}
            <div className="mb-6">
              <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Start Date *
              </label>
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
              <p className="mt-1 text-sm text-gray-500">
                When your campaign will start accepting pledges
              </p>
            </div>

            {/* Campaign End Date */}
            <div className="mb-6">
              <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign End Date *
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
                Campaign duration must be between 1 day and 90 days
              </p>
            </div>

            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Campaign preview"
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
                        Upload a campaign image
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PNG, JPG, GIF up to 5MB
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
                    <div className="mt-4">
                      <span className="text-gray-500">or</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!imageFile && (
                <div className="mt-4">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Alternative)
                  </label>
                  <div className="relative">
                    <PhotoIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-crypto-blue focus:border-transparent ${
                        errors.imageUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}
              
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Campaign Guidelines */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Campaign Guidelines
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Campaigns must have a clear, achievable goal</li>
                <li>• Be transparent about how funds will be used</li>
                <li>• Provide regular updates to supporters</li>
                <li>• Funds are only released if the goal is reached</li>
                <li>• All transactions are recorded on the blockchain</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
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
                      {uploadingToIPFS ? 'Uploading to IPFS...' : 'Creating Campaign...'}
                    </span>
                  </div>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Transaction Status Modal */}
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