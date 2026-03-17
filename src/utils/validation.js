import { APP_CONSTANTS, CAMPAIGN_STATUS } from '../constants';

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid address
 */
export const isValidAddress = (address) => {
  try {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch {
    return false;
  }
};

/**
 * Validate ETH amount
 * @param {string} amount - Amount to validate
 * @returns {boolean} True if valid amount
 */
export const isValidEthAmount = (amount) => {
  try {
    if (!amount || isNaN(parseFloat(amount))) return false;
    const num = parseFloat(amount);
    return num > 0 && num <= 1000000; // Max 1M ETH for safety
  } catch {
    return false;
  }
};

/**
 * Validate campaign deadline
 * @param {Date} deadline - Campaign deadline
 * @returns {boolean} True if valid deadline
 */
export const isValidDeadline = (deadline) => {
  try {
    if (!deadline || !(deadline instanceof Date)) return false;
    const now = new Date();
    
    // Deadline must be in the future
    if (deadline <= now) return false;
    
    // Calculate duration from now
    const durationMs = deadline.getTime() - now.getTime();
    const durationSeconds = durationMs / 1000;
    
    // Must be between min and max duration
    return durationSeconds >= APP_CONSTANTS.MIN_CAMPAIGN_DURATION && 
           durationSeconds <= APP_CONSTANTS.MAX_CAMPAIGN_DURATION;
  } catch {
    return false;
  }
};

/**
 * Validate campaign goal
 * @param {string|number} goal - Campaign goal in ETH
 * @returns {boolean} True if valid goal
 */
export const isValidCampaignGoal = (goal) => {
  return isValidEthAmount(goal) && parseFloat(goal) >= 0.01; // Min 0.01 ETH
};

/**
 * Validate campaign title
 * @param {string} title - Campaign title
 * @returns {boolean} True if valid title
 */
export const isValidCampaignTitle = (title) => {
  return typeof title === 'string' && 
         title.trim().length >= 3 && 
         title.trim().length <= 100;
};

/**
 * Validate campaign description
 * @param {string} description - Campaign description
 * @returns {boolean} True if valid description
 */
export const isValidCampaignDescription = (description) => {
  return typeof description === 'string' && 
         description.trim().length >= 10 && 
         description.trim().length <= 1000;
};

/**
 * Validate campaign URL
 * @param {string} url - Campaign URL
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url) return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate campaign start date
 * @param {Date} startDate - Campaign start date
 * @param {Date} endDate - Campaign end date
 * @returns {boolean} True if valid start date
 */
export const isValidStartDate = (startDate, endDate) => {
  try {
    if (!startDate || !(startDate instanceof Date)) return false;
    if (!endDate || !(endDate instanceof Date)) return false;
    
    const now = new Date();
    
    // Start date must not be in the past (allow some tolerance for timezone differences)
    const toleranceMs = 5 * 60 * 1000; // 5 minutes tolerance
    if (startDate.getTime() < now.getTime() - toleranceMs) return false;
    
    // Start date must be before end date
    if (startDate >= endDate) return false;
    
    // Start date must be reasonable (not too far in future)
    const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    if (startDate > maxFutureDate) return false;
    
    // Campaign duration must be valid
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationSeconds = durationMs / 1000;
    
    if (durationSeconds < APP_CONSTANTS.MIN_CAMPAIGN_DURATION || 
        durationSeconds > APP_CONSTANTS.MAX_CAMPAIGN_DURATION) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Get validation errors for campaign form
 * @param {Object} campaignData - Campaign form data
 * @returns {Object} Object with validation errors
 */
export const validateCampaignForm = (campaignData) => {
  const errors = {};
  
  if (!isValidCampaignTitle(campaignData.title)) {
    errors.title = 'Title must be between 3 and 100 characters';
  }
  
  if (!isValidCampaignDescription(campaignData.description)) {
    errors.description = 'Description must be between 10 and 1000 characters';
  }
  
  if (!isValidCampaignGoal(campaignData.goal)) {
    errors.goal = 'Goal must be a valid amount (minimum 0.01 ETH)';
  }
  
  // Validate end date
  if (campaignData.endAt) {
    const endDate = new Date(campaignData.endAt);
    if (!isValidDeadline(endDate)) {
      const now = new Date();
      const minEndDate = new Date(now.getTime() + APP_CONSTANTS.MIN_CAMPAIGN_DURATION * 1000);
      const maxEndDate = new Date(now.getTime() + APP_CONSTANTS.MAX_CAMPAIGN_DURATION * 1000);
      
      if (endDate <= now) {
        errors.endAt = 'End date must be in the future';
      } else if (endDate < minEndDate) {
        errors.endAt = 'Campaign must run for at least 1 day';
      } else if (endDate > maxEndDate) {
        errors.endAt = 'Campaign cannot run for more than 90 days';
      } else {
        errors.endAt = 'End date is invalid';
      }
    }
  } else {
    errors.endAt = 'End date is required';
  }
  
  // Validate start date
  if (campaignData.startAt && campaignData.endAt) {
    const startDate = new Date(campaignData.startAt);
    const endDate = new Date(campaignData.endAt);
    
    if (!isValidStartDate(startDate, endDate)) {
      const now = new Date();
      
      if (startDate >= endDate) {
        errors.startAt = 'Start date must be before end date';
      } else if (startDate < now) {
        errors.startAt = 'Start date cannot be in the past';
      } else {
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        
        if (durationDays < 1) {
          errors.startAt = 'Campaign duration must be at least 1 day';
        } else if (durationDays > 90) {
          errors.startAt = 'Campaign duration cannot exceed 90 days';
        } else {
          errors.startAt = 'Start date is invalid';
        }
      }
    }
  } else if (!campaignData.startAt) {
    errors.startAt = 'Start date is required';
  }
  
  if (campaignData.imageUrl && !isValidUrl(campaignData.imageUrl)) {
    errors.imageUrl = 'Please enter a valid URL';
  }
  
  return errors;
};

/**
 * Validate pledge amount
 * @param {string} amount - Pledge amount
 * @param {bigint} userBalance - User's ETH balance
 * @returns {Object} Object with validation result
 */
export const validatePledgeAmount = (amount, userBalance) => {
  const result = { isValid: true, error: null };
  
  if (!isValidEthAmount(amount)) {
    result.isValid = false;
    result.error = 'Invalid amount format';
    return result;
  }
  
  const amountWei = BigInt(amount) * BigInt(10**18); // Simplified conversion
  
  if (userBalance < amountWei) {
    result.isValid = false;
    result.error = 'Insufficient funds';
  }
  
  return result;
};

/**
 * Compute campaign status locally, mirroring CrowdFundV2.getCampaignStatus()
 * @param {Object} campaign - Campaign object with status, claimed, startAt, endAt, pledged, goal
 * @returns {number} Status enum value (0-5)
 */
export const getCampaignStatusLocal = (campaign) => {
  if (!campaign) return null;
  
  // Check stored status for Cancelled
  if (Number(campaign.status) === CAMPAIGN_STATUS.CANCELLED) return CAMPAIGN_STATUS.CANCELLED;
  // Check claimed flag
  if (campaign.claimed) return CAMPAIGN_STATUS.CLAIMED;
  
  const now = Math.floor(Date.now() / 1000);
  if (now < campaign.startAt) return CAMPAIGN_STATUS.UPCOMING;
  if (now <= campaign.endAt) return CAMPAIGN_STATUS.ACTIVE;
  
  // Campaign ended - check if goal reached
  if (BigInt(campaign.pledged) >= BigInt(campaign.goal)) return CAMPAIGN_STATUS.SUCCESSFUL;
  return CAMPAIGN_STATUS.FAILED;
};

/**
 * Check if campaign is active (considers Cancelled status from v2)
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if campaign is active
 */
export const isCampaignActive = (campaign) => {
  if (!campaign) return false;
  return getCampaignStatusLocal(campaign) === CAMPAIGN_STATUS.ACTIVE;
};

/**
 * Check if campaign has ended
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if campaign has ended
 */
export const isCampaignEnded = (campaign) => {
  if (!campaign) return false;
  const status = getCampaignStatusLocal(campaign);
  return status === CAMPAIGN_STATUS.SUCCESSFUL ||
         status === CAMPAIGN_STATUS.FAILED ||
         status === CAMPAIGN_STATUS.CLAIMED;
};

/**
 * Check if campaign is cancelled
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if campaign is cancelled
 */
export const isCampaignCancelled = (campaign) => {
  if (!campaign) return false;
  return getCampaignStatusLocal(campaign) === CAMPAIGN_STATUS.CANCELLED;
};

/**
 * Check if campaign is claimed
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if campaign funds have been claimed
 */
export const isCampaignClaimed = (campaign) => {
  if (!campaign) return false;
  return getCampaignStatusLocal(campaign) === CAMPAIGN_STATUS.CLAIMED;
};

/**
 * Check if campaign is upcoming
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if campaign has not started yet
 */
export const isCampaignUpcoming = (campaign) => {
  if (!campaign) return false;
  return getCampaignStatusLocal(campaign) === CAMPAIGN_STATUS.UPCOMING;
};

/**
 * Check if campaign goal is reached
 * @param {Object} campaign - Campaign object
 * @returns {boolean} True if goal is reached
 */
export const isGoalReached = (campaign) => {
  if (!campaign) return false;
  return BigInt(campaign.pledged) >= BigInt(campaign.goal);
};

/**
 * Check if user can claim funds (v2: uses status-based logic)
 * @param {Object} campaign - Campaign object
 * @param {string} userAddress - User's address
 * @returns {boolean} True if user can claim
 */
export const canUserClaim = (campaign, userAddress) => {
  if (!campaign || !userAddress) return false;
  const status = getCampaignStatusLocal(campaign);
  return campaign.creator.toLowerCase() === userAddress.toLowerCase() &&
         status === CAMPAIGN_STATUS.SUCCESSFUL &&
         !campaign.claimed;
};

/**
 * Check if user can get refund (v2: uses status-based logic)
 * @param {Object} campaign - Campaign object
 * @param {string|bigint} userPledgedAmount - User's pledged amount
 * @returns {boolean} True if user can get refund
 */
export const canUserRefund = (campaign, userPledgedAmount) => {
  if (!campaign || !userPledgedAmount) return false;
  const status = getCampaignStatusLocal(campaign);
  const pledgedBigInt = typeof userPledgedAmount === 'bigint'
    ? userPledgedAmount
    : BigInt(userPledgedAmount);
  return status === CAMPAIGN_STATUS.FAILED && pledgedBigInt > 0n;
};

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};