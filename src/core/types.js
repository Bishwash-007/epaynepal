/**
 * Shared enumerations and JSDoc contracts that approximate the SDK's TypeScript
 * types while keeping the runtime in plain JavaScript.
 */

export const Providers = Object.freeze({
  ESEWA: "esewa",
  KHALTI: "khalti",
});

export const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});

export const PaymentEvents = Object.freeze({
  PAYMENT_INITIATED: "payment.pending",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",
});

/**
 * @typedef {Object} PaymentInitResponse
 * @property {string} provider
 * @property {string} transactionId
 * @property {number} amount
 * @property {'NPR'} currency
 * @property {'PENDING'|'SUCCESS'|'FAILED'} status
 * @property {string=} redirectUrl
 * @property {unknown} raw
 */

/**
 * @typedef {Object} PaymentVerifyResponse
 * @property {string} provider
 * @property {string} transactionId
 * @property {'SUCCESS'|'FAILED'} status
 * @property {string=} referenceId
 * @property {unknown} raw
 */

/**
 * @typedef {Object} RefundResponse
 * @property {string} provider
 * @property {string} transactionId
 * @property {'SUCCESS'|'FAILED'} status
 * @property {unknown} raw
 */

/**
 * @typedef {Object} PaymentProvider
 * @property {(payload: Record<string, any>) => Promise<PaymentInitResponse>} initiatePayment
 * @property {(payload: Record<string, any>) => Promise<PaymentVerifyResponse>} verifyPayment
 * @property {(payload: Record<string, any>) => Promise<RefundResponse>} [refund]
 * @property {(payload: Record<string, any>) => Promise<PaymentVerifyResponse>} [handleCallback]
 */
