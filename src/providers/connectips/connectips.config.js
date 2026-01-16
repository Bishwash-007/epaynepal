import { z } from 'zod';
import { InvalidConfigError } from '../../core/errors.js';

const BASE_URLS = {
  sandbox: 'https://sandbox.connectips.com',
  production: 'https://api.connectips.com'
};

const STATUS_URLS = {
  sandbox: 'https://sandbox.connectips.com/api/merchant/status',
  production: 'https://api.connectips.com/api/merchant/status'
};

const configSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  appId: z.string().min(1, 'appId is required'),
  appSecret: z.string().min(1, 'appSecret is required'),
  username: z.string().min(1, 'username is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  failureUrl: z.string().url('failureUrl must be a valid URL'),
  env: z.enum(['sandbox', 'production']).default('sandbox'),
  baseUrl: z.string().url().optional(),
  statusUrl: z.string().url().optional(),
  currency: z.literal('NPR').default('NPR'),
  timeout: z.number().int().positive().max(60000).default(10000)
});

export const buildConnectIpsConfig = (input = {}) => {
  try {
    const env = input.env || 'sandbox';
    const defaults = {
      baseUrl: BASE_URLS[env],
      statusUrl: STATUS_URLS[env]
    };
    const parsed = configSchema.parse({ ...defaults, ...input });
    return parsed;
  } catch (error) {
    throw new InvalidConfigError('Invalid ConnectIPS configuration', {
      cause: error
    });
  }
};
