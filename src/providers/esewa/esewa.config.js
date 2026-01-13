import { z } from 'zod';
import { InvalidConfigError } from '../../core/errors.js';

const BASE_URLS = {
  sandbox: 'https://rc-epay.esewa.com.np/api/epay/main/v2',
  production: 'https://epay.esewa.com.np/api/epay/main/v2'
};

const STATUS_URLS = {
  sandbox: 'https://rc.esewa.com.np/api/epay/transaction/status',
  production: 'https://esewa.com.np/api/epay/transaction/status'
};

const configSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  productCode: z.string().min(1, 'productCode is required'),
  secretKey: z.string().min(1, 'secretKey is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  failureUrl: z.string().url('failureUrl must be a valid URL'),
  env: z.enum(['sandbox', 'production']).default('sandbox'),
  baseUrl: z.string().url().optional(),
  statusUrl: z.string().url().optional(),
  currency: z.literal('NPR').default('NPR'),
  signedFieldNames: z
    .string()
    .default('total_amount,transaction_uuid,product_code'),
  timeout: z.number().int().positive().max(60000).default(10000)
});

export const buildEsewaConfig = (input = {}) => {
  try {
    const env = input.env || 'sandbox';
    const defaults = {
      baseUrl: BASE_URLS[env],
      statusUrl: STATUS_URLS[env]
    };
    const parsed = configSchema.parse({ ...defaults, ...input });
    const formUrl = parsed.baseUrl.endsWith('/form')
      ? parsed.baseUrl
      : `${parsed.baseUrl.replace(/\/$/, '')}/form`;
    return {
      ...parsed,
      formUrl
    };
  } catch (error) {
    throw new InvalidConfigError('Invalid eSewa configuration', {
      cause: error
    });
  }
};
