export const environment = {
  production: false,
  development: true,
  apiUrl: 'https://localhost:8443/api',
  logLevel: 'debug',
  enableDevTools: true,
  sessionTimeout: 900, // 15 minutes en secondes
  securitySettings: {
    csrfEnabled: true,
    strictCsp: false,  // Activer en production
    xssProtection: true
  }
};
