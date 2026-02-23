// IPFS/Pinata Configuration
export const PINATA_API_URL = 'https://api.pinata.cloud/pinning';
export const PINATA_JSON_ENDPOINT = `${PINATA_API_URL}/pinJSONToIPFS`;
export const PINATA_FILE_ENDPOINT = `${PINATA_API_URL}/pinFileToIPFS`;
export const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Contract ABI for CrowdFund.sol (updated with metadata field and helper functions)
export const CROWD_FUND_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
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
    "name": "Launch",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "Cancel",
    "type": "event"
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
    "name": "Pledge",
    "type": "event"
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
    "name": "UnPledge",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "Claim",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
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
    "name": "Refund",
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
    "name": "launch",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "pledge",
    "outputs": [],
    "stateMutability": "payable",
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
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "unpledge",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "address",
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
    "name": "campaignExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
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
        "internalType": "uint8",
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
  }
];

// Contract addresses (update these with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  // Base Sepolia testnet
  base_sepolia: "0xB46A2a4a569cf16EF7A1e92ea5eCEDe7ACFF374D",
  // Ethereum Sepolia testnet
  ethereum_sepolia: "0x99146Ca2eBDdB854D93881d1890fC9536612ff25",
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