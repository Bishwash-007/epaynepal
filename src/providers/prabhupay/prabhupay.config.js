import { z } from 'zod';
import { InvalidConfigError } from '../../core/errors.js';

const BASE_URLS = {
  sandbox: 'https://sandbox.prabhupay.com.np',
  production: 'https://api.prabhupay.com.np'
};

const API_URLS = {
  sandbox: 'https://sandbox-api.prabhupay.com.np',
  production: 'https://api.prabhupay.com.np'
};

const configSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  apiKey: z.string().min(1, 'apiKey is required'),
  secretKey: z.string().min(1, 'secretKey is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  failureUrl: z.string().url('failureUrl must be a valid URL'),
  env: z.enum(['sandbox', 'production']).default('sandbox'),
  baseUrl: z.string().url().optional(),
  apiUrl: z.string().url().optional(),
  currency: z.literal('NPR').default('NPR'),
  timeout: z.number().int().positive().max(60000).default(10000)
});

export const buildPrabhuPayConfig = (input = {}) => {
  try {
    const env = input.env || 'sandbox';
    const defaults = {
      baseUrl: BASE_URLS[env],
      apiUrl: API_URLS[env]
    };
    const parsed = configSchema.parse({ ...defaults, ...input });
    return parsed;
  } catch (error) {
    throw new InvalidConfigError('Invalid Prabhu Pay configuration', {
      cause: error
    });
  }
};
