/// <reference types="vite/client" />

export const DOMAIN_CONFIG = {
  primary: import.meta.env.VITE_APP_DOMAIN || 'jeantrail.com',
  review: import.meta.env.VITE_REVIEW_DOMAIN || 'review.jeantrail.com',
  api: import.meta.env.VITE_API_DOMAIN || 'api.jeantrail.com',
  
  // Dashboard mock data (centralized for easy abstraction)
  portfolio: [
    'jeantrail.com',
    'jeantrail.local',
    'jeantrail.dev'
  ],
  marketplace: [
    { domain: 'jeantrail.app', price: '$1,200', status: 'display-only' },
    { domain: 'jeantrail.ai', price: '$2,800', status: 'display-only' },
    { domain: 'jeantrail.store', price: '$900', status: 'display-only' }
  ]
};
