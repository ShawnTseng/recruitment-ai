import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { useEffect } from 'react'
import { loginRequest, apiScopes } from '../auth/msalConfig'
import { setTokenProvider } from '../services/api'

interface Props {
  children: React.ReactNode
}

/**
 * Wraps protected routes. Triggers login popup if not authenticated.
 * Also registers the token provider so api.ts can attach Bearer tokens.
 */
export default function AuthGuard({ children }: Props) {
  const isAuthenticated = useIsAuthenticated()
  const { instance, accounts } = useMsal()

  // Register token provider once authenticated
  useEffect(() => {
    if (isAuthenticated && accounts[0]) {
      setTokenProvider(async () => {
        const result = await instance.acquireTokenSilent({
          scopes: apiScopes,
          account: accounts[0],
        }).catch(() => instance.acquireTokenPopup({ scopes: apiScopes }))
        return result.accessToken
      })
    }
  }, [isAuthenticated, instance, accounts])

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <h2 style={{ color: '#202124' }}>Sign in required</h2>
        <p style={{ color: '#666' }}>This page requires an organizational account.</p>
        <button
          onClick={() => instance.loginPopup(loginRequest)}
          style={{ padding: '10px 28px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Sign in with Microsoft
        </button>
      </div>
    )
  }

  return <>{children}</>
}
