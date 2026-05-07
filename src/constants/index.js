// IPFS/Pinata Configuration
export const PINATA_API_URL = 'https://api.pinata.cloud/pinning';
export const PINATA_JSON_ENDPOINT = `${PINATA_API_URL}/pinJSONToIPFS`;
export const PINATA_FILE_ENDPOINT = `${PINATA_API_URL}/pinFileToIPFS`;
export const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Contract ABI for CrowdFund.sol (updated with metadata field and helper functions)
export const CROWD_FUND_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "cancelCampaign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "CancelCampaign",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "claimFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ClaimFunds",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_goal",
				"type": "uint256"
			},
			{
				"internalType": "uint32",
				"name": "_startAt",
				"type": "uint32"
			},
			{
				"internalType": "uint32",
				"name": "_endAt",
				"type": "uint32"
			},
			{
				"internalType": "string",
				"name": "_metadata",
				"type": "string"
			}
		],
		"name": "createCampaign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "goal",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "startAt",
				"type": "uint32"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "endAt",
				"type": "uint32"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			}
		],
		"name": "CreateCampaign",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "fundCampaign",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundCampaign",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "refundContribution",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "RefundContribution",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "withdrawPledge",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "WithdrawPledge",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "campaigns",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "goal",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pledged",
				"type": "uint256"
			},
			{
				"internalType": "uint32",
				"name": "startAt",
				"type": "uint32"
			},
			{
				"internalType": "uint32",
				"name": "endAt",
				"type": "uint32"
			},
			{
				"internalType": "bool",
				"name": "claimed",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			},
			{
				"internalType": "enum CrowdFund.Status",
				"name": "status",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "count",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getCampaign",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address payable",
						"name": "creator",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "goal",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pledged",
						"type": "uint256"
					},
					{
						"internalType": "uint32",
						"name": "startAt",
						"type": "uint32"
					},
					{
						"internalType": "uint32",
						"name": "endAt",
						"type": "uint32"
					},
					{
						"internalType": "bool",
						"name": "claimed",
						"type": "bool"
					},
					{
						"internalType": "string",
						"name": "metadata",
						"type": "string"
					},
					{
						"internalType": "enum CrowdFund.Status",
						"name": "status",
						"type": "uint8"
					}
				],
				"internalType": "struct CrowdFund.Campaign",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getCampaignStatus",
		"outputs": [
			{
				"internalType": "enum CrowdFund.Status",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "pledgedAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "pledgedOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Campaign Status enum matching CrowdFundV2 contract
export const CAMPAIGN_STATUS = {
  UPCOMING: 0,
  ACTIVE: 1,
  SUCCESSFUL: 2,
  FAILED: 3,
  CANCELLED: 4,
  CLAIMED: 5,
};

// Status labels for display
export const CAMPAIGN_STATUS_LABELS = {
  [CAMPAIGN_STATUS.UPCOMING]: 'Akan Datang',
  [CAMPAIGN_STATUS.ACTIVE]: 'Aktif',
  [CAMPAIGN_STATUS.SUCCESSFUL]: 'Berhasil',
  [CAMPAIGN_STATUS.FAILED]: 'Gagal',
  [CAMPAIGN_STATUS.CANCELLED]: 'Dibatalkan',
  [CAMPAIGN_STATUS.CLAIMED]: 'Dicairkan',
};

// Contract addresses
export const CONTRACT_ADDRESSES = {
  // Base Sepolia testnet
  base_sepolia: "0xC16FAA27C5278853aD90e52621EbE3FD7A2F2840",
  // Ethereum Sepolia testnet
  ethereum_sepolia: "0xDE02F7A53d72389cA93CB0c3EA841b5B3A60685E",
};

// Contract deployment block numbers — verified from block explorers
// Base Sepolia: https://sepolia.basescan.org/address/0xC16FAA27C5278853aD90e52621EbE3FD7A2F2840
// Eth Sepolia:  https://sepolia.etherscan.io/address/0xDE02F7A53d72389cA93CB0c3EA841b5B3A60685E
export const CONTRACT_DEPLOY_BLOCKS = {
  '84532':    40357097,  // Base Sepolia — actual deployment block
  '11155111': 10462385,  // Ethereum Sepolia — actual deployment block
};

// Maximum blocks per eth_getLogs call for each network's public RPC
export const RPC_CHUNK_SIZES = {
  '84532':    1500,   // https://sepolia.base.org — strict ~2000 block limit
  '11155111': 50000,  // https://ethereum-sepolia-rpc.publicnode.com — permissive
  default:    2000,
};

// Network configurations
export const NETWORKS = {
  ethereum_sepolia: {
    chainId: "0xaa36a7",
    chainName: "Ethereum Sepolia",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://sepolia.infura.io/v3/"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
  },
  base_sepolia: {
    chainId: "0x14a34",
    chainName: "Base Sepolia",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"]
  },
};

// App constants
export const APP_CONSTANTS = {
  // Maximum campaign duration (90 days as per contract)
  MAX_CAMPAIGN_DURATION: 90 * 24 * 60 * 60, // 90 days in seconds
  
  // Minimum campaign duration (1 day)
  MIN_CAMPAIGN_DURATION: 1 * 24 * 60 * 60, // 1 day in seconds
  
  // Default values
  DEFAULT_GOAL_ETH: "0.01",
  DEFAULT_DEADLINE_DAYS: 30,
  
  // Recommended networks
  RECOMMENDED_NETWORKS: ["base_sepolia", "ethereum_sepolia"],
  DEFAULT_NETWORK: "base_sepolia",
  
  // Currency
  CURRENCY_SYMBOL: "ETH",
  CURRENCY_NAME: "Ethereum",
  
  // UI Constants
  CAMPAIGN_CARD_LIMIT: 12,
  DASHBOARD_TAB_LIMIT: 10,
  
  // Error messages
  ERRORS: {
    WALLET_NOT_CONNECTED: "Please connect your wallet first",
    CAMPAIGN_NOT_FOUND: "Campaign not found",
    NOT_CAMPAIGN_CREATOR: "You are not the creator of this campaign",
    CAMPAIGN_NOT_STARTED: "Campaign has not started yet",
    CAMPAIGN_ENDED: "Campaign has ended",
    INSUFFICIENT_FUNDS: "Insufficient funds",
    TRANSACTION_FAILED: "Transaction failed",
    NETWORK_MISMATCH: "Please switch to the correct network",
    INVALID_AMOUNT: "Please enter a valid amount",
    NETWORK_NOT_SUPPORTED: "This network is not supported. Please switch to Base Sepolia or Ethereum Sepolia."
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    CAMPAIGN_CREATED: "Campaign created successfully!",
    PLEDGE_SUCCESSFUL: "Pledge successful!",
    UNPLEDGE_SUCCESSFUL: "Unpledge successful!",
    CLAIM_SUCCESSFUL: "Claim successful!",
    REFUND_SUCCESSFUL: "Refund successful!",
    WALLET_CONNECTED: "Wallet connected successfully!"
  }
};