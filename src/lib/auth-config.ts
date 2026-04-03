export const AUTH_CONFIG = {
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1098804852901-pdvc6u2btp4lqaad0gd85v5mgahicn2o.apps.googleusercontent.com',
  STORAGE_KEYS: {
    TOKEN: 'haoshi_access_token',
    USER: 'haoshi_user_data',
  },
} as const
