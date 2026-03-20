import { Configuration, PopupRequest } from '@azure/msal-browser';

const CLIENT_ID = '54eccf4b-3d8b-4714-9810-f3f0ae72e8d0';
const TENANT_ID = 'c37b5e1d-8f41-4d76-9212-8f49396541b0';
const API_SCOPE = 'api://54eccf4b-3d8b-4714-9810-f3f0ae72e8d0/api.access';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: [API_SCOPE],
};

export const apiScopes = [API_SCOPE];
