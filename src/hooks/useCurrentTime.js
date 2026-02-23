import { useState, useEffect } from 'react';

/**
 * Custom hook that provides the current timestamp
 * This avoids ESLint warnings about calling impure functions in render
 */
const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};

export default useCurrentTime;