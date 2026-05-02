import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CROWD_FUND_ABI, CONTRACT_ADDRESSES, APP_CONSTANTS, CAMPAIGN_STATUS } from '../constants';
import { fetchFromIPFS } from '../utils/ipfs';
import { getCampaignStatusLocal } from '../utils/validation';
import { getChainIdFromNetworkSlug } from '../utils/network';

// Public RPC endpoints for read-only access (no wallet needed)
const PUBLIC_RPC = {
  ethereum_sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  base_sepolia: 'https://sepolia.base.org',
};

const NETWORK_RPC = {
  eth: PUBLIC_RPC.ethereum_sepolia,
  base: PUBLIC_RPC.base_sepolia,
};

const NETWORK_CONTRACT_ADDRESS = {
  eth: CONTRACT_ADDRESSES.ethereum_sepolia,
  base: CONTRACT_ADDRESSES.base_sepolia,
};

const DEFAULT_NETWORK_SLUG = 'eth';

export const useContract = (signer, account, networkSlug = DEFAULT_NETWORK_SLUG) => {
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [userContributions, setUserContributions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize contract - supports both read-only (no wallet) and write (with wallet) modes
  useEffect(() => {
    const resolvedNetworkSlug = networkSlug === 'base' ? 'base' : 'eth';
    const desiredChainId = getChainIdFromNetworkSlug(resolvedNetworkSlug) || '11155111';
    const contractAddress = NETWORK_CONTRACT_ADDRESS[resolvedNetworkSlug];
    const rpcUrl = NETWORK_RPC[resolvedNetworkSlug];

    const initializeReadOnlyContract = () => {
      try {
        setIsReadOnly(true);
        const readOnlyProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readOnlyContract = new ethers.Contract(
          contractAddress,
          CROWD_FUND_ABI,
          readOnlyProvider
        );

        console.log('Initializing contract (read-only mode) Address:', contractAddress, 'Network:', resolvedNetworkSlug);
        setContract(readOnlyContract);
      } catch (err) {
        console.error('Error initializing read-only contract:', err);
      }
    };

    if (signer && account) {
      try {
        const provider = signer.provider;
        provider.getNetwork().then((network) => {
          const chainId = network.chainId.toString();
          console.log('🔍 NETWORK DEBUG: Detected chain ID:', chainId);

          if (chainId === desiredChainId) {
            console.log('Initializing contract (write mode) on chain:', chainId, 'Address:', contractAddress);
            const crowdFundContract = new ethers.Contract(
              contractAddress,
              CROWD_FUND_ABI,
              signer
            );
            setIsReadOnly(false);
            setContract(crowdFundContract);
          } else {
            console.log('Wallet chain mismatch for route network:', resolvedNetworkSlug, 'expected chainId:', desiredChainId, 'but wallet is on:', chainId, 'Using read-only provider instead.');
            initializeReadOnlyContract();
          }
        }).catch((err) => {
          console.error('Error getting network:', err);
          setError('Failed to get network information');
          initializeReadOnlyContract();
        });
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract');
        initializeReadOnlyContract();
      }
      return;
    }

    initializeReadOnlyContract();
  }, [signer, account, networkSlug]);

  // Format raw campaign data from contract to frontend-friendly object
  const formatCampaign = (campaign, id) => {
    return {
      id: id,
      creator: campaign.creator,
      goal: campaign.goal.toString(),
      pledged: campaign.pledged.toString(),
      startAt: Number(campaign.startAt),
      endAt: Number(campaign.endAt),
      claimed: campaign.claimed,
      metadata: campaign.metadata,
      status: Number(campaign.status), // v2: Status enum (0=Upcoming, 1=Active, 2=Successful, 3=Failed, 4=Cancelled, 5=Claimed)
    };
  };

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
      console.log('fetchCampaigns: Contract address:', contract?.target || contract?.address || 'undefined');
      
      let totalCampaigns;
      try {
        console.log('fetchCampaigns: Calling contract.count()...');
        const campaignCount = await contract.count();
        console.log('fetchCampaigns: Raw campaign count:', campaignCount.toString());
        totalCampaigns = Number(campaignCount);
        console.log('fetchCampaigns: Parsed campaign count:', totalCampaigns);
      } catch (countError) {
        console.error('fetchCampaigns: ERROR calling contract.count():', countError);
        throw countError;
      }
      
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
        const formatted = formatCampaign(campaign, index + 1);
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

  // Fetch user's campaigns (created by user)
  const fetchUserCampaigns = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const userCreatedCampaigns = campaigns.filter(
        campaign => campaign.creator.toLowerCase() === account.toLowerCase()
      );
      setUserCampaigns(userCreatedCampaigns);
    } catch (err) {
      console.error('Error fetching user campaigns:', err);
      setError('Failed to fetch user campaigns');
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
      
      // metadata should already have ipfs:// prefix from uploadToIPFS
      // V2 contract: createCampaign(goal, startAt, endAt, metadata)
      // If startAt = 0, contract sets startAt = block.timestamp (start immediately)
      const tx = await contract.createCampaign(goalWei, startAt, endAt, metadata);
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
      const errorMessage = err.reason || err.message || 'Failed to create campaign';
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
      
      // V2 contract: fundCampaign(id) payable
      const tx = await contract.fundCampaign(campaignId, { value: amountWei });
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error pledging:', err);
      const errorMessage = err.reason || err.message || 'Failed to pledge';
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
      
      // V2 contract: withdrawPledge(id, amount)
      const tx = await contract.withdrawPledge(campaignId, amountWei);
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error unpledging:', err);
      const errorMessage = err.reason || err.message || 'Failed to unpledge';
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

      // V2 contract: claimFunds(id)
      const tx = await contract.claimFunds(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns
      await fetchCampaigns();
      
      return receipt;
    } catch (err) {
      console.error('Error claiming funds:', err);
      const errorMessage = err.reason || err.message || 'Failed to claim funds';
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

      // V2 contract: refundContribution(id)
      const tx = await contract.refundContribution(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns and user contributions
      await fetchCampaigns();
      await fetchUserContributions();
      
      return receipt;
    } catch (err) {
      console.error('Error getting refund:', err);
      const errorMessage = err.reason || err.message || 'Failed to get refund';
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

      // V2 contract: cancelCampaign(id)
      const tx = await contract.cancelCampaign(campaignId);
      const receipt = await tx.wait();

      // Refresh campaigns
      await fetchCampaigns();
      
      return receipt;
    } catch (err) {
      console.error('Error canceling campaign:', err);
      const errorMessage = err.reason || err.message || 'Failed to cancel campaign';
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
      return formatCampaign(campaign, Number(campaignId));
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

  /**
   * Fetch individual donation list for a campaign from FundCampaign events (on-chain data).
   * Returns each donation as a separate entry, sorted by amount (highest first).
   * @param {number|string} campaignId - Campaign ID to query
   * @returns {Promise<Array<{address: string, amount: string, txHash: string, blockNumber: number}>>}
   */
  const getCampaignDonors = useCallback(async (campaignId) => {
    if (!contract || !campaignId) return [];

    try {
      console.log('getCampaignDonors: Starting for campaign', campaignId);
      
      const providerNetwork = await contract.runner.provider.getNetwork();
      const isBaseSepolia = providerNetwork.chainId.toString() === '84532';
      
      if (isBaseSepolia) {
        try {
          console.log('Fetching donors from Base Sepolia Blockscout Explorer API...');
          const contractAddress = contract.target || contract.address;
          const apiUrl = `https://base-sepolia.blockscout.com/api?module=logs&action=getLogs&address=${contractAddress}&fromBlock=0&toBlock=latest`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result)) {
            const donations = [];
            for (const log of data.result) {
              try {
                const parsedLog = contract.interface.parseLog({ topics: log.topics, data: log.data });
                if (parsedLog && parsedLog.name === 'FundCampaign' && parsedLog.args.id.toString() === campaignId.toString()) {
                  donations.push({
                    address: parsedLog.args.caller,
                    amount: parsedLog.args.amount.toString(),
                    txHash: log.transactionHash,
                    blockNumber: parseInt(log.blockNumber, 16) || 0,
                  });
                }
              } catch (e) {}
            }
            donations.sort((a, b) => {
              const diff = BigInt(b.amount) - BigInt(a.amount);
              return diff > 0n ? 1 : diff < 0n ? -1 : 0;
            });
            return donations;
          }
        } catch (err) {
          console.warn('Failed to fetch from explorer API, falling back to RPC:', err);
        }
      }

      // Get current block number for safer event querying
      let currentBlock;
      try {
        currentBlock = await contract.runner.provider.getBlockNumber();
      } catch (err) {
        console.warn('getCampaignDonors: Could not get block number, using "latest"', err);
        currentBlock = 'latest';
      }

      // Query FundCampaign events filtered by campaign ID (indexed)
      // Use a safe range: last 1,000,000 blocks or from block 0
      let fromBlock = 0;
      if (typeof currentBlock === 'number' && currentBlock > 1000000) {
        fromBlock = currentBlock - 1000000;
      }
      
      console.log('getCampaignDonors: Querying events from block', fromBlock, 'to', currentBlock);
      
      const filter = contract.filters.FundCampaign(campaignId);
      const events = await contract.queryFilter(filter, fromBlock, currentBlock);

      console.log('getCampaignDonors: Found', events.length, 'donation events');

      // Return individual donation events (not aggregated)
      const donations = events.map((event) => ({
        address: event.args.caller,
        amount: event.args.amount.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      }));

      // Sort by amount descending (highest donation first)
      donations.sort((a, b) => {
        const diff = BigInt(b.amount) - BigInt(a.amount);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });

      return donations;
    } catch (err) {
      console.error('getCampaignDonors: Error fetching campaign donors:', err);
      return [];
    }
  }, [contract]);

  /**
   * Fetch all transaction events related to the connected user.
   * Returns a list of all user's on-chain activity.
   * @returns {Promise<Array<{type: string, campaignId: string, amount: string, txHash: string, blockNumber: number}>>}
   */
  const getUserTransactionHistory = useCallback(async () => {
    if (!contract || !account) return [];

    try {
      console.log('getUserTransactionHistory: Starting for account', account);
      
      const providerNetwork = await contract.runner.provider.getNetwork();
      const isBaseSepolia = providerNetwork.chainId.toString() === '84532';
      
      if (isBaseSepolia) {
        try {
          console.log('Fetching user tx history from Base Sepolia Blockscout Explorer API...');
          const contractAddress = contract.target || contract.address;
          const apiUrl = `https://base-sepolia.blockscout.com/api?module=logs&action=getLogs&address=${contractAddress}&fromBlock=0&toBlock=latest`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result)) {
            const allEvents = [];
            for (const log of data.result) {
              try {
                const parsedLog = contract.interface.parseLog({ topics: log.topics, data: log.data });
                if (!parsedLog) continue;
                
                const eventName = parsedLog.name;
                const txHash = log.transactionHash;
                const blockNumber = parseInt(log.blockNumber, 16) || 0;
                
                if (eventName === 'FundCampaign' && parsedLog.args.caller.toLowerCase() === account.toLowerCase()) {
                  allEvents.push({ type: 'fund', campaignId: parsedLog.args.id.toString(), amount: parsedLog.args.amount.toString(), txHash, blockNumber });
                } else if (eventName === 'WithdrawPledge' && parsedLog.args.caller.toLowerCase() === account.toLowerCase()) {
                  allEvents.push({ type: 'withdraw', campaignId: parsedLog.args.id.toString(), amount: parsedLog.args.amount.toString(), txHash, blockNumber });
                } else if (eventName === 'RefundContribution' && parsedLog.args.caller.toLowerCase() === account.toLowerCase()) {
                  allEvents.push({ type: 'refund', campaignId: parsedLog.args.id.toString(), amount: parsedLog.args.amount.toString(), txHash, blockNumber });
                } else if (eventName === 'CreateCampaign' && parsedLog.args.creator.toLowerCase() === account.toLowerCase()) {
                  allEvents.push({ type: 'create', campaignId: parsedLog.args.id.toString(), amount: parsedLog.args.goal.toString(), txHash, blockNumber });
                } else if (eventName === 'ClaimFunds' || eventName === 'CancelCampaign') {
                  try {
                    const campaign = await contract.campaigns(parsedLog.args.id);
                    if (campaign.creator.toLowerCase() === account.toLowerCase()) {
                      allEvents.push({
                        type: eventName === 'ClaimFunds' ? 'claim' : 'cancel',
                        campaignId: parsedLog.args.id.toString(),
                        amount: eventName === 'ClaimFunds' ? parsedLog.args.amount.toString() : '0',
                        txHash,
                        blockNumber
                      });
                    }
                  } catch (e) {}
                }
              } catch (e) {}
            }
            allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
            return allEvents;
          }
        } catch (err) {
          console.warn('Failed to fetch from explorer API, falling back to RPC:', err);
        }
      }
      
      // Get safe block range for event querying
      let currentBlock;
      let fromBlock = 0;
      try {
        currentBlock = await contract.runner.provider.getBlockNumber();
        if (typeof currentBlock === 'number' && currentBlock > 1000000) {
          fromBlock = currentBlock - 1000000;
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Could not get block number', err);
        currentBlock = 'latest';
      }
      
      console.log('getUserTransactionHistory: Querying events from block', fromBlock, 'to', currentBlock);

      const allEvents = [];

      // FundCampaign events (user = caller) — donations made
      try {
        const fundFilter = contract.filters.FundCampaign(null, account);
        const fundEvents = await contract.queryFilter(fundFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', fundEvents.length, 'FundCampaign events');
        for (const e of fundEvents) {
          allEvents.push({
            type: 'fund',
            campaignId: e.args.id.toString(),
            amount: e.args.amount.toString(),
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          });
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying FundCampaign events:', err);
      }

      // WithdrawPledge events (user = caller) — withdrawals
      try {
        const withdrawFilter = contract.filters.WithdrawPledge(null, account);
        const withdrawEvents = await contract.queryFilter(withdrawFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', withdrawEvents.length, 'WithdrawPledge events');
        for (const e of withdrawEvents) {
          allEvents.push({
            type: 'withdraw',
            campaignId: e.args.id.toString(),
            amount: e.args.amount.toString(),
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          });
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying WithdrawPledge events:', err);
      }

      // RefundContribution events (user = caller) — refunds received
      try {
        const refundFilter = contract.filters.RefundContribution(null, account);
        const refundEvents = await contract.queryFilter(refundFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', refundEvents.length, 'RefundContribution events');
        for (const e of refundEvents) {
          allEvents.push({
            type: 'refund',
            campaignId: e.args.id.toString(),
            amount: e.args.amount.toString(),
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          });
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying RefundContribution events:', err);
      }

      // ClaimFunds events — check if user is creator who claimed
      try {
        const claimFilter = contract.filters.ClaimFunds();
        const claimEvents = await contract.queryFilter(claimFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', claimEvents.length, 'ClaimFunds events');
        for (const e of claimEvents) {
          // Check if the campaign creator is the current user
          try {
            const campaign = await contract.campaigns(e.args.id);
            if (campaign.creator.toLowerCase() === account.toLowerCase()) {
              allEvents.push({
                type: 'claim',
                campaignId: e.args.id.toString(),
                amount: e.args.amount.toString(),
                txHash: e.transactionHash,
                blockNumber: e.blockNumber,
              });
            }
          } catch {
            // skip if campaign lookup fails
          }
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying ClaimFunds events:', err);
      }

      // CreateCampaign events (user = creator)
      try {
        const createFilter = contract.filters.CreateCampaign(null, account);
        const createEvents = await contract.queryFilter(createFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', createEvents.length, 'CreateCampaign events');
        for (const e of createEvents) {
          allEvents.push({
            type: 'create',
            campaignId: e.args.id.toString(),
            amount: e.args.goal.toString(),
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          });
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying CreateCampaign events:', err);
      }

      // CancelCampaign events
      try {
        const cancelFilter = contract.filters.CancelCampaign();
        const cancelEvents = await contract.queryFilter(cancelFilter, fromBlock, currentBlock);
        console.log('getUserTransactionHistory: Found', cancelEvents.length, 'CancelCampaign events');
        for (const e of cancelEvents) {
          try {
            const campaign = await contract.campaigns(e.args.id);
            if (campaign.creator.toLowerCase() === account.toLowerCase()) {
              allEvents.push({
                type: 'cancel',
                campaignId: e.args.id.toString(),
                amount: '0',
                txHash: e.transactionHash,
                blockNumber: e.blockNumber,
              });
            }
          } catch {
            // skip
          }
        }
      } catch (err) {
        console.warn('getUserTransactionHistory: Error querying CancelCampaign events:', err);
      }

      // Sort by block number descending (newest first)
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      
      console.log('getUserTransactionHistory: Total events collected:', allEvents.length);

      return allEvents;
    } catch (err) {
      console.error('getUserTransactionHistory: Error fetching user transaction history:', err);
      return [];
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
    isReadOnly,
    
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
    
    // Event-based data (on-chain)
    getCampaignDonors,
    getUserTransactionHistory,
    
    // Computed values
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => {
      return getCampaignStatusLocal(c) === CAMPAIGN_STATUS.ACTIVE;
    }).length,
    totalPledged: campaigns.reduce((sum, c) => sum + BigInt(c.pledged), 0n).toString(),
  };
};
