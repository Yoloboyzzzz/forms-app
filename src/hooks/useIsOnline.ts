import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** True while the device has a connection. Assumes online until the first report arrives. */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // isInternetReachable is null while unknown; only a clear "not connected" counts as offline.
    return NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
  }, []);

  return isOnline;
}
