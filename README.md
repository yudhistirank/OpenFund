# OpenFund - Decentralized Crowdfunding Platform

A modern, fully-functional React.js crowdfunding platform built on Base network with MetaMask integration and smart contract connectivity.

## 🚀 Features

### Core Functionality
- **Smart Contract Integration**: Direct interaction with CrowdFund.sol smart contract
- **MetaMask Integration**: Seamless wallet connection and network switching
- **Campaign Management**: Create, browse, and manage crowdfunding campaigns
- **Pledge System**: Support campaigns with ETH contributions
- **User Dashboard**: Track personal contributions and created campaigns
- **Real-time Updates**: Live campaign progress and transaction status

### User Experience
- **Modern UI**: Clean, minimalist design with Base network color scheme
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Loading States**: Comprehensive loading indicators and error handling
- **Transaction Status**: Real-time transaction tracking with modal notifications
- **Form Validation**: Client-side validation with user-friendly error messages

### Technical Features
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **State Management**: Custom React hooks for wallet and contract interactions
- **Error Handling**: Robust error management throughout the application
- **Performance**: Optimized components with proper memoization
- **Accessibility**: ARIA labels and keyboard navigation support

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: TailwindCSS with custom Base network theme
- **Blockchain**: Ethers.js for smart contract interaction
- **Wallet Integration**: MetaMask with network switching
- **Routing**: React Router v6
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Development**: ESLint with React hooks rules

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx      # Main navigation with wallet connection
│   │   ├── Footer.jsx      # Site footer with links
│   │   ├── WalletConnect.jsx # Wallet connection component
│   │   ├── CampaignCard.jsx # Campaign display card
│   │   ├── LoadingSpinner.jsx # Loading indicator
│   │   ├── LoadMoreButton.jsx # Pagination component
│   │   └── TransactionStatus.jsx # Transaction modal
│   ├── pages/              # Main application pages
│   │   ├── Landing.jsx     # Landing page with hero section
│   │   ├── HomePage.jsx    # Campaign listing with filters
│   │   ├── CreateCampaign.jsx # Campaign creation form
│   │   ├── CampaignDetail.jsx # Individual campaign view
│   │   └── UserDashboard.jsx # User dashboard with stats
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.js    # Wallet connection and management
│   │   ├── useContract.js  # Smart contract interactions
│   │   └── useCurrentTime.js # Time management hook
│   ├── utils/              # Utility functions
│   │   ├── format.js       # Formatting utilities
│   │   └── validation.js   # Form validation functions
│   ├── constants/          # Application constants
│   │   └── index.js        # Contract ABIs and configurations
│   ├── styles/             # Additional styles (if needed)
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # TailwindCSS configuration
├── postcss.config.js       # PostCSS configuration
└── vite.config.js          # Vite configuration
```

## 🏗️ Smart Contract Integration

The frontend integrates with the CrowdFund.sol smart contract with the following functions:

### Campaign Management
- `createCampaign(goal, endAt)` - Create new campaign
- `getCampaigns(skip, limit)` - Get paginated campaigns
- `getCampaignById(id)` - Get specific campaign
- `getUserCampaigns(user)` - Get user's created campaigns

### Contribution System
- `pledge(campaignId, amount)` - Contribute to campaign
- `unpledge(campaignId)` - Withdraw contribution
- `getUserContribution(campaignId, user)` - Get user's contribution
- `getUserContributions(user)` - Get all user contributions

### Settlement Functions
- `claim(campaignId)` - Creator claims successful campaign funds
- `refund(campaignId)` - Contributor claims refund for failed campaign

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask browser extension
- Base network configured in MetaMask

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OpenFund/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_CONTRACT_ADDRESS=your_contract_address
   VITE_NETWORK_CHAIN_ID=8453
   VITE_EXPLORER_URL=https://basescan.org
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

### Network Configuration

The application is configured for Base network:
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Currency**: ETH
- **Block Explorer**: BaseScan

## 💻 Key Components

### WalletConnect Component
- Handles MetaMask connection
- Network switching to Base
- Account management
- Connection status display

### CampaignCard Component
- Displays campaign information
- Progress bar visualization
- Status badges
- Creator and deadline info

### TransactionStatus Component
- Modal for transaction feedback
- Success, pending, and error states
- Transaction hash display
- Explorer link integration

### Custom Hooks

#### useWallet
- Manages wallet connection state
- Handles account changes
- Network validation
- Balance retrieval

#### useContract
- Smart contract interaction wrapper
- Campaign CRUD operations
- Contribution management
- Event listeners

## 🔧 Smart Contract Deployment

To deploy the CrowdFund.sol contract:

1. **Compile the contract**
   ```bash
   npx hardhat compile
   ```

2. **Deploy to Base network**
   ```bash
   npx hardhat run scripts/deploy.js --network base
   ```

3. **Update contract address** in `src/constants/index.js`

## 🧪 Testing

### Wallet Integration Testing
1. Connect MetaMask to Base network
2. Test campaign creation
3. Test pledge/unpledge functionality
4. Verify transaction confirmations

### Responsive Design Testing
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667)

### Error Handling Testing
- Network disconnection
- Insufficient funds
- Invalid contract interactions
- MetaMask not installed

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated
- **Transaction Safety**: Confirmation required for all blockchain interactions
- **Network Validation**: Ensures correct network before transactions
- **Error Boundaries**: Comprehensive error handling throughout

## 📱 Mobile Experience

- **Responsive Navigation**: Collapsible mobile menu
- **Touch Optimization**: Proper touch targets and gestures
- **Performance**: Optimized for mobile browsers
- **Wallet Integration**: MetaMask mobile app compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Changelog

### Version 1.1.6
- Connected with IPFS (Pinata)
- More Responsive design
- Transaction management
- Detail transaction
- Success, pending, and error states
- Transaction hash display
- Explorer link integration
- Switch language ID/ENG
- Visibility "jelajah" public
- Change donor rank to list donor
- Banner Image Size Guidelines
- Dashboard campaign from IPFS metadata
- Add logo OpenFund

---
