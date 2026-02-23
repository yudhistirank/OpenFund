import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CROWD_FUND_ABI, CONTRACT_ADDRESSES, APP_CONSTANTS } from '../constants';
import { fetchFromIPFS } from '../utils/ipfs';

export const useContract = (signer, account) => {
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [userContributions, setUserContributions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (!signer || !account) {
      setContract(null);
      return;
    }

    try {
      // Get current chain ID to determine contract address
      const provider = signer.provider;
      provider.getNetwork().then((network) => {
        const chainId = network.chainId.toString();
        console.log('🔍 NETWORK DEBUG: Detected chain ID:', chainId);
        
        let contractAddress = CONTRACT_ADDRESSES.base_sepolia; // Default to Base Sepolia
        
        if (chainId === '11155111') {
          contractAddress = CONTRACT_ADDRESSES.ethereum_sepolia;
          console.log('🔍 NETWORK DEBUG: Using Ethereum Sepolia contract:', contractAddress);
        } else if (chainId === '8453') {
          contractAddress = CONTRACT_ADDRESSES.base_mainnet;
          console.log('🔍 NETWORK DEBUG: Using Base Mainnet contract:', contractAddress);
        } else if (chainId === '84532') {
          contractAddress = CONTRACT_ADDRESSES.base_sepolia;
          console.log('🔍 NETWORK DEBUG: Using Base Sepolia contract:', contractAddress);
        } else {
          console.log('🔍 NETWORK DEBUG: Using default Base Sepolia contract:', contractAddress);
          console.log('⚠️  WARNING: Unknown chain ID. Make sure you are on Base Sepolia (84532) or Ethereum Sepolia (11155111)');
        }
        
        console.log('Initializing contract on chain:', chainId, 'Address:', contractAddress);
        console.log('🔍 CONTRACT DEBUG: Using address', contractAddress, 'for chain', chainId);
        console.log('🔍 CONTRACT DEBUG: This should be the ACTUAL deployed contract address');
        console.log('🔍 CONTRACT DEBUG: If this is 0x99146Ca2eBDdB854D93881d1890fC9536612ff25, that\'s the ISSUE!');
        
        const crowdFundContract = new ethers.Contract(
          contractAddress,
          CROWD_FUND_ABI,
          signer
        );
        
        setContract(crowdFundContract);
      }).catch((err) => {
        console.error('Error getting network:', err);
        setError('Failed to get network information');
      });
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError('Failed to initialize contract');
    }
  }, [signer, account]);

  // Fetch all campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!contract) {
      console.log('fetchCampaigns: No contract available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('fetchCampaigns: Starting campaign fetch...');
      console.log('fetchCampaigns: Contract address:', contract?.address || 'undefined - check contract initialization');
      
      let totalCampaigns;
      try {
        console.log('fetchCampaigns: Calling contract.count()...');
        const campaignCount = await contract.count();
        console.log('fetchCampaigns: Raw campaign count:', campaignCount.toString());
        totalCampaigns = Number(campaignCount);
        console.log('fetchCampaigns: Parsed campaign count:', totalCampaigns);
      } catch (countError) {
        console.error('fetchCampaigns: ERROR calling contract.count():', countError);
        console.error('fetchCampaigns: This might indicate contract interaction issues');
        throw countError;
      }
      
      console.log('fetchCampaigns: Total campaigns found:', totalCampaigns);
      
      if (totalCampaigns === 0) {
        console.log('fetchCampaigns: No campaigns, setting empty array');
        setCampaigns([]);
        return;
      }

      const campaignPromises = [];
      for (let i = 1; i <= totalCampaigns; i++) {
        campaignPromises.push(contract.campaigns(i));
      }

      console.log('fetchCampaigns: Fetching individual campaign data...');
      const campaignData = await Promise.all(campaignPromises);
      
      const formattedCampaigns = campaignData.map((campaign, index) => {
        const formatted = {
          id: index + 1,
          creator: campaign.creator,
          goal: campaign.goal.toString(),
          pledged: campaign.pledged.toString(),
          startAt: Number(campaign.startAt),
          endAt: Number(campaign.endAt),
          claimed: campaign.claimed,
          metadata: campaign.metadata
        };
        // Only log first campaign to reduce spam
        if (index === 0) {
          console.log(`fetchCampaigns: Campaign ${index + 1}:`, formatted);
        }
        return formatted;
      });

      console.log('fetchCampaigns: Setting campaigns state:', formattedCampaigns.length, 'campaigns');
      setCampaigns(formattedCampaigns);
      console.log('fetchCampaigns: Campaigns state updated successfully');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Fetch user's campaigns
  const fetchUserCampaigns = useCallback(async () => {
    if (!contract || !account) return;

    try {
      setIsLoading(true);
      const allCampaigns = await fetchCampaigns();
      if (!allCampaigns) return;

      const userCreatedCampaigns = campaigns.filter(
        campaign => campaign.creator.toLowerCase() === account.toLowerCase()
      );
      
      setUserCampaigns(userCreatedCampaigns);
    } catch (err) {
      console.error('Error fetching user campaigns:', err);
      setError('Failed to fetch user campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, campaigns]);

  // Fetch user's contributions
  const fetchUserContributions = useCallback(async () => {
    if (!contract || !account || campaigns.length === 0) return;

    try {
      const contributions = {};
      
      for (const campaign of campaigns) {
        const pledgedAmount = await contract.pledgedOf(campaign.id, account);
        if (pledgedAmount > 0n) {
          contributions[campaign.id] = pledgedAmount.toString();
        }
      }
      
      setUserContributions(contributions);
    } catch (err) {
      console.error('Error fetching user contributions:', err);
    }
  }, [contract, account, campaigns]);

  // Create new campaign
  const createCampaign = useCallback(async (goal, startAt, endAt, metadata) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('createCampaign: Starting campaign creation...');
      console.log('createCampaign: Parameters:', { goal, startAt, endAt, metadata });

      const goalWei = ethers.parseEther(goal.toString());
      
      const tx = await contract.launch(goalWei, startAt, endAt, metadata);
      console.log('createCampaign: Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('createCampaign: Transaction confirmed:', receipt.hash);

      // Refresh campaigns after creation
      console.log('createCampaign: Refreshing campaigns list...');
      await fetchCampaigns();
      console.log('createCampaign: Campaigns refreshed successfully');
      
      return receipt;
    } catch (err) {
      console.error('Error creating campaign:', err);
      const errorMessage = err.message || 'Failed to create campaign';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns]);

  // Pledge to campaign
  const pledgeToCampaign = useCallback(async (campaignId, amount) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      const amountWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.pledge(campaignId, { value: amountWei });
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error pledging:', err);
      const errorMessage = err.message || 'Failed to pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns, fetchUserContributions]);

  // Unpledge from campaign
  const unpledgeFromCampaign = useCallback(async (campaignId, amount) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      const amountWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.unpledge(campaignId, amountWei);
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error unpledging:', err);
      const errorMessage = err.message || 'Failed to unpledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns, fetchUserContributions]);

  // Claim funds (for campaign creators)
  const claimFunds = useCallback(async (campaignId) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      const tx = await contract.claim(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns
      await fetchCampaigns();
      
      return receipt;
    } catch (err) {
      console.error('Error claiming funds:', err);
      const errorMessage = err.message || 'Failed to claim funds';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns]);

  // Get refund
  const getRefund = useCallback(async (campaignId) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      const tx = await contract.refund(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error getting refund:', err);
      const errorMessage = err.message || 'Failed to get refund';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns, fetchUserContributions]);

  // Cancel campaign (only for creators, before start)
  const cancelCampaign = useCallback(async (campaignId) => {
    if (!contract || !account) {
      throw new Error(APP_CONSTANTS.ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      setIsLoading(true);
      setError(null);

      const tx = await contract.cancel(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns
      await fetchCampaigns();
      
      return receipt;
    } catch (err) {
      console.error('Error canceling campaign:', err);
      const errorMessage = err.message || 'Failed to cancel campaign';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchCampaigns]);

  // Get specific campaign by ID
  const getCampaign = useCallback(async (campaignId) => {
    if (!contract || !campaignId) return null;

    try {
      const campaign = await contract.campaigns(campaignId);
      return {
        id: Number(campaignId),
        creator: campaign.creator,
        goal: campaign.goal.toString(),
        pledged: campaign.pledged.toString(),
        startAt: Number(campaign.startAt),
        endAt: Number(campaign.endAt),
        claimed: campaign.claimed,
        metadata: campaign.metadata
      };
    } catch (err) {
      console.error('Error fetching campaign:', err);
      return null;
    }
  }, [contract]);

  // Fetch campaign metadata from IPFS
  const getCampaignMetadata = useCallback(async (metadataCid) => {
    if (!metadataCid || metadataCid === '') return null;
    
    try {
      const metadata = await fetchFromIPFS(metadataCid);
      return metadata;
    } catch (err) {
      console.error('Error fetching campaign metadata:', err);
      return null;
    }
  }, []);

  // Get campaign with metadata from IPFS
  const getCampaignWithMetadata = useCallback(async (campaignId) => {
    const campaign = await getCampaign(campaignId);
    if (!campaign) return null;
    
    const metadata = await getCampaignMetadata(campaign.metadata);
    return {
      ...campaign,
      metadataContent: metadata
    };
  }, [getCampaign, getCampaignMetadata]);

  // Get user's pledged amount for a campaign
  const getUserPledgedAmount = useCallback(async (campaignId) => {
    if (!contract || !account || !campaignId) return '0';

    try {
      const pledgedAmount = await contract.pledgedOf(campaignId, account);
      return pledgedAmount.toString();
    } catch (err) {
      console.error('Error fetching user pledged amount:', err);
      return '0';
    }
  }, [contract, account]);

  // Auto-fetch data when contract is ready
  useEffect(() => {
    if (contract) {
      console.log('useContract: Contract ready, fetching campaigns...');
      fetchCampaigns();
    }
  }, [contract]); // Removed fetchCampaigns from dependencies to prevent infinite loop

  // Auto-fetch user data when account changes
  useEffect(() => {
    if (account && campaigns.length > 0) {
      fetchUserCampaigns();
      fetchUserContributions();
    }
  }, [account, campaigns, fetchUserCampaigns, fetchUserContributions]);

  return {
    // State
    contract,
    campaigns,
    userCampaigns,
    userContributions,
    isLoading,
    error,
    
    // Campaign operations
    createCampaign,
    pledgeToCampaign,
    unpledgeFromCampaign,
    claimFunds,
    getRefund,
    cancelCampaign,
    
    // Data fetching
    fetchCampaigns,
    fetchUserCampaigns,
    fetchUserContributions,
    getCampaign,
    getUserPledgedAmount,
    getCampaignMetadata,
    getCampaignWithMetadata,
    
    // Computed values
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => {
      const now = Math.floor(Date.now() / 1000);
      return now >= c.startAt && now <= c.endAt;
    }).length,
    totalPledged: campaigns.reduce((sum, c) => sum + BigInt(c.pledged), 0n).toString(),
  };
};