import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CROWD_FUND_ABI, CONTRACT_ADDRESSES, APP_CONSTANTS, CAMPAIGN_STATUS, CONTRACT_DEPLOY_BLOCKS, RPC_CHUNK_SIZES } from '../constants';
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
   * Query contract events in network-aware chunks, then merge results.
   * Handles RPC providers that limit eth_getLogs block range (e.g. Base Sepolia ~2000 blk).
   * @param {ethers.EventFilter} filter
   * @param {number} fromBlock
   * @param {number} toBlock
   * @param {number} chunkSize  - blocks per request
   * @returns {Promise<ethers.EventLog[]>}
   */
  const _queryEventChunked = useCallback(async (filter, fromBlock, toBlock, chunkSize) => {
    if (chunkSize >= (toBlock - fromBlock)) {
      // Range fits in one request — no chunking needed
      return contract.queryFilter(filter, fromBlock, toBlock);
    }
    const chunks = [];
    for (let start = fromBlock; start <= toBlock; start += chunkSize) {
      chunks.push([start, Math.min(start + chunkSize - 1, toBlock)]);
    }
    // Run up to 5 chunks in parallel to stay fast without hammering the RPC
    const PARALLEL = 5;
    const allEvents = [];
    for (let i = 0; i < chunks.length; i += PARALLEL) {
      const batch = chunks.slice(i, i + PARALLEL);
      const results = await Promise.allSettled(
        batch.map(([from, to]) => contract.queryFilter(filter, from, to))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') allEvents.push(...r.value);
        else console.warn('_queryEventChunked chunk failed:', r.reason?.message);
      }
    }
    return allEvents;
  }, [contract]);

  /**
   * Fetch individual donation list for a campaign from FundCampaign events (on-chain).
   * Sorted by amount descending.
   */
  const getCampaignDonors = useCallback(async (campaignId) => {
    if (!contract || !campaignId) return [];
    try {
      const network = await contract.runner.provider.getNetwork();
      const chainId = network.chainId.toString();
      const chunkSize = RPC_CHUNK_SIZES[chainId] ?? RPC_CHUNK_SIZES.default;
      const deployBlock = CONTRACT_DEPLOY_BLOCKS[chainId] ?? 0;

      const currentBlock = await contract.runner.provider.getBlockNumber();
      const fromBlock = Math.max(deployBlock, 0);

      console.log(`getCampaignDonors: chain=${chainId} chunkSize=${chunkSize} from=${fromBlock} to=${currentBlock}`);

      const filter = contract.filters.FundCampaign(campaignId);
      const events = await _queryEventChunked(filter, fromBlock, currentBlock, chunkSize);

      console.log('getCampaignDonors: Found', events.length, 'events');

      const donations = events.map((e) => ({
        address: e.args.caller,
        amount: e.args.amount.toString(),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      }));

      donations.sort((a, b) => {
        const diff = BigInt(b.amount) - BigInt(a.amount);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });
      return donations;
    } catch (err) {
      console.error('getCampaignDonors: Error:', err);
      return [];
    }
  }, [contract, _queryEventChunked]);

  /**
   * Fetch all transaction events for the connected user.
   * All event types queried in PARALLEL for speed.
   */
  const getUserTransactionHistory = useCallback(async () => {
    if (!contract || !account) return [];
    try {
      console.log('getUserTransactionHistory: Starting for account', account);

      const network = await contract.runner.provider.getNetwork();
      const chainId = network.chainId.toString();
      const chunkSize = RPC_CHUNK_SIZES[chainId] ?? RPC_CHUNK_SIZES.default;
      const deployBlock = CONTRACT_DEPLOY_BLOCKS[chainId] ?? 0;
      const currentBlock = await contract.runner.provider.getBlockNumber();
      const fromBlock = Math.max(deployBlock, 0);

      console.log(`getUserTransactionHistory: chain=${chainId} chunkSize=${chunkSize} from=${fromBlock} to=${currentBlock}`);

      // Run ALL event type queries in PARALLEL — this is the key speed improvement
      const [
        fundRes, withdrawRes, refundRes, claimRes, createRes, cancelRes
      ] = await Promise.allSettled([
        _queryEventChunked(contract.filters.FundCampaign(null, account),          fromBlock, currentBlock, chunkSize),
        _queryEventChunked(contract.filters.WithdrawPledge(null, account),        fromBlock, currentBlock, chunkSize),
        _queryEventChunked(contract.filters.RefundContribution(null, account),    fromBlock, currentBlock, chunkSize),
        _queryEventChunked(contract.filters.ClaimFunds(),                         fromBlock, currentBlock, chunkSize),
        _queryEventChunked(contract.filters.CreateCampaign(null, account),        fromBlock, currentBlock, chunkSize),
        _queryEventChunked(contract.filters.CancelCampaign(),                     fromBlock, currentBlock, chunkSize),
      ]);

      const allEvents = [];

      // FundCampaign — donations made
      if (fundRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: FundCampaign events:', fundRes.value.length);
        for (const e of fundRes.value) {
          allEvents.push({ type: 'fund', campaignId: e.args.id.toString(), amount: e.args.amount.toString(), txHash: e.transactionHash, blockNumber: e.blockNumber });
        }
      } else console.warn('FundCampaign query failed:', withdrawRes.reason?.message);

      // WithdrawPledge
      if (withdrawRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: WithdrawPledge events:', withdrawRes.value.length);
        for (const e of withdrawRes.value) {
          allEvents.push({ type: 'withdraw', campaignId: e.args.id.toString(), amount: e.args.amount.toString(), txHash: e.transactionHash, blockNumber: e.blockNumber });
        }
      } else console.warn('WithdrawPledge query failed:', withdrawRes.reason?.message);

      // RefundContribution
      if (refundRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: RefundContribution events:', refundRes.value.length);
        for (const e of refundRes.value) {
          allEvents.push({ type: 'refund', campaignId: e.args.id.toString(), amount: e.args.amount.toString(), txHash: e.transactionHash, blockNumber: e.blockNumber });
        }
      } else console.warn('RefundContribution query failed:', refundRes.reason?.message);

      // ClaimFunds — filter by creator
      if (claimRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: ClaimFunds events (total):', claimRes.value.length);
        const creatorChecks = await Promise.allSettled(
          claimRes.value.map(async (e) => {
            const campaign = await contract.campaigns(e.args.id);
            if (campaign.creator.toLowerCase() === account.toLowerCase()) {
              return { type: 'claim', campaignId: e.args.id.toString(), amount: e.args.amount.toString(), txHash: e.transactionHash, blockNumber: e.blockNumber };
            }
            return null;
          })
        );
        for (const r of creatorChecks) {
          if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
        }
      } else console.warn('ClaimFunds query failed:', claimRes.reason?.message);

      // CreateCampaign
      if (createRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: CreateCampaign events:', createRes.value.length);
        for (const e of createRes.value) {
          allEvents.push({ type: 'create', campaignId: e.args.id.toString(), amount: e.args.goal.toString(), txHash: e.transactionHash, blockNumber: e.blockNumber });
        }
      } else console.warn('CreateCampaign query failed:', createRes.reason?.message);

      // CancelCampaign — filter by creator
      if (cancelRes.status === 'fulfilled') {
        console.log('getUserTransactionHistory: CancelCampaign events (total):', cancelRes.value.length);
        const creatorChecks = await Promise.allSettled(
          cancelRes.value.map(async (e) => {
            const campaign = await contract.campaigns(e.args.id);
            if (campaign.creator.toLowerCase() === account.toLowerCase()) {
              return { type: 'cancel', campaignId: e.args.id.toString(), amount: '0', txHash: e.transactionHash, blockNumber: e.blockNumber };
            }
            return null;
          })
        );
        for (const r of creatorChecks) {
          if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
        }
      } else console.warn('CancelCampaign query failed:', cancelRes.reason?.message);

      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      console.log('getUserTransactionHistory: Total events:', allEvents.length);
      return allEvents;
    } catch (err) {
      console.error('getUserTransactionHistory: Error:', err);
      return [];
    }
  }, [contract, account, _queryEventChunked]);

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
      const now = Math.floor(Date.now() / 1000);
      return c.status === 1 || (c.status === 0 && now >= c.startAt && now <= c.endAt);
    }).length,
  };
};
