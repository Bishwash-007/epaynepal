import { z } from 'zod';
import { InvalidConfigError } from '../../core/errors.js';

const BASE_URLS = {
  sandbox: 'https://stg.imepay.com.np',
  production: 'https://imepay.com.np'
};

const API_URLS = {
  sandbox: 'https://stgapi.imepay.com.np',
  production: 'https://api.imepay.com.np'
};

const configSchema = z.object({
  merchantCode: z.string().min(1, 'merchantCode is required'),
  merchantName: z.string().min(1, 'merchantName is required'),
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
  module: z.string().min(1, 'module is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  failureUrl: z.string().url('failureUrl must be a valid URL'),
  env: z.enum(['sandbox', 'production']).default('sandbox'),
  baseUrl: z.string().url().optional(),
  apiUrl: z.string().url().optional(),
  currency: z.literal('NPR').default('NPR'),
  timeout: z.number().int().positive().max(60000).default(10000)
});

export const buildImePayConfig = (input = {}) => {
  try {
    const env = input.env || 'sandbox';
    const defaults = {
      baseUrl: BASE_URLS[env],
      apiUrl: API_URLS[env]
    };
    const parsed = configSchema.parse({ ...defaults, ...input });
    return parsed;
  } catch (error) {
    throw new InvalidConfigError('Invalid IME Pay configuration', {
      cause: error
    });
  }
};
