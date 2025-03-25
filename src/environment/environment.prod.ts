export const environment = {
  production: true,
  development: false,
  apiUrl: 'https://api.example.com/api',
  logLevel: 'error',
  enableDevTools: false,
  sessionTimeout: 900,
  securitySettings: {
    csrfEnabled: true,
    strictCsp: true,
    xssProtection: true
  }
};
