import { PINATA_JSON_ENDPOINT, PINATA_FILE_ENDPOINT, IPFS_GATEWAY_URL } from '../constants';

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - JSON object to upload
 * @returns {Promise<string>} - IPFS hash (CID)
 */
export const uploadToIPFS = async (metadata) => {
  try {
    console.log('Uploading metadata to IPFS:', metadata);
    
    const response = await fetch(PINATA_JSON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY || '',
        'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_KEY || ''
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataOptions: {
          cidVersion: 1
        }
      })
    });

    console.log('IPFS Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IPFS Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('IPFS Success response:', data);
    
    if (!data.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata');
    }
    
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

/**
 * Upload image file to IPFS via Pinata
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - IPFS hash (CID)
 */
export const uploadImageToIPFS = async (file) => {
  try {
    console.log('Uploading image to IPFS:', file.name, 'Size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }));

    const response = await fetch(PINATA_FILE_ENDPOINT, {
      method: 'POST',
      headers: {
        'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY || '',
        'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_KEY || ''
      },
      body: formData
    });

    console.log('IPFS Image Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IPFS Image Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('IPFS Image Success response:', data);
    
    if (!data.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata for image');
    }
    
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw new Error(`Failed to upload image to IPFS: ${error.message}`);
  }
};

/**
 * Fetch metadata from IPFS
 * @param {string} cid - IPFS hash (CID)
 * @returns {Promise<Object>} - Parsed JSON metadata
 */
export const fetchFromIPFS = async (cid) => {
  try {
    const response = await fetch(`${IPFS_GATEWAY_URL}${cid}`);

    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS');
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS hash (CID)
 * @returns {string} - Full gateway URL
 */
export const getIPFSUrl = (cid) => {
  return `${IPFS_GATEWAY_URL}${cid}`;
};

/**
 * Test IPFS connectivity with Pinata
 * @returns {Promise<boolean>} - True if connection works
 */
export const testIPFSConnection = async () => {
  try {
    console.log('Testing IPFS connection...');
    
    const testMetadata = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'IPFS connection test'
    };
    
    const hash = await uploadToIPFS(testMetadata);
    console.log('IPFS connection test successful:', hash);
    return true;
  } catch (error) {
    console.error('IPFS connection test failed:', error);
    return false;
  }
};

/**
 * Create campaign metadata object
 * @param {Object} formData - Campaign form data
 * @param {string} imageCid - IPFS hash for campaign image
 * @returns {Object} - Complete metadata object
 */
export const createCampaignMetadata = (formData, imageCid = null) => {
  return {
    title: formData.title,
    description: formData.description,
    image: imageCid ? getIPFSUrl(imageCid) : formData.imageUrl,
    createdAt: new Date().toISOString(),
    version: '1.0'
  };
};
