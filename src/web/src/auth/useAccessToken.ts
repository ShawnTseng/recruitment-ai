import { useMsal } from '@azure/msal-react';
import { apiScopes } from './msalConfig';

/**
 * Returns a function that acquires an access token silently.
 * Falls back to popup if silent acquisition fails (e.g. consent required).
 */
export function useAccessToken() {
  const { instance, accounts } = useMsal();

  return async (): Promise<string> => {
    const account = accounts[0];
    if (!account) throw new Error('No signed-in account');

    const result = await instance.acquireTokenSilent({
      scopes: apiScopes,
      account,
    }).catch(() =>
      instance.acquireTokenPopup({ scopes: apiScopes })
    );

    return result.accessToken;
  };
}
