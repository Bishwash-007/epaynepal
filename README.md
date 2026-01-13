# NepalPay SDK (JavaScript)

> Unified event-driven SDK that aggregates Nepali payment gateways (eSewa, Khalti) behind a consistent API surface.

## Why NepalPay?

- **Integrate once**: Switch providers without rewriting business logic.
- **Normalized responses**: Every adapter returns the same payload shape.
- **Security-first**: Built-in HMAC helpers, signature verification, and safe HTTP wrapper.
- **Event-driven**: Listen for `payment.pending`, `payment.success`, `payment.failed` on a single EventEmitter.
- **Extensible**: Add new providers by implementing the `PaymentProvider` contract and wiring them through the factory.

```
src/
 ├─ core/            # NepalPay entry, provider factory, shared types, events, errors
 ├─ providers/       # Adapter + mapper + config per gateway
 ├─ utils/           # crypto, http, logger helpers
 └─ index.js         # Package entry (ESM)
```

## Requirements

- Node.js 18+
- Merchant credentials for at least one supported provider

## Installation

```bash
npm install epaynepal
```

## Quick Start

```js
import NepalPay from 'epaynepal';

const payment = new NepalPay({
  esewa: {
    merchantId: process.env.ESEWA_MERCHANT_ID,
    productCode: process.env.ESEWA_PRODUCT_CODE,
    secretKey: process.env.ESEWA_SECRET,
    successUrl: 'https://merchant.app/payments/esewa/success',
    failureUrl: 'https://merchant.app/payments/esewa/failure',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  },
  khalti: {
    publicKey: process.env.KHALTI_PUBLIC_KEY,
    secretKey: process.env.KHALTI_SECRET_KEY,
    returnUrl: 'https://merchant.app/payments/khalti/callback',
    websiteUrl: 'https://merchant.app',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  },
});

const initiation = await payment.initiate('esewa', {
  amount: 1000,
  taxAmount: 0,
  transactionUuid: 'order-2401',
  additionalFields: { customer_name: 'Ada' }
});

// Render initiation.raw.fields as an auto-submit POST form targeting initiation.redirectUrl

const verification = await payment.verify('esewa', {
  transactionUuid: 'order-2401',
  totalAmount: 1000
});

payment.on('payment.success', (event) => {
  console.log('payment settled', event.transactionId);
});
```

## Normalized Responses

```js
// PaymentInitResponse
{
  provider: 'esewa',
  transactionId: 'order-2401',
  amount: 1000,
  currency: 'NPR',
  status: 'PENDING',
  redirectUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  raw: { url, method: 'POST', fields }
}

// PaymentVerifyResponse
{
  provider: 'khalti',
  transactionId: 'bZQLD9wRVWo4CdESSfuSsB',
  status: 'SUCCESS',
  referenceId: 'GFq9PFS7b2iYvL8Lir9oXe',
  raw: { status: 'Completed', total_amount: 1000, ... }
}
```

## Events & Webhooks

| Event              | Emitted when |
| ------------------ | ------------ |
| `payment.pending`  | After initiation or lookup returns Pending/Initiated |
| `payment.success`  | When verification / callback confirms SUCCESS |
| `payment.failed`   | When verification / callback marks FAILED |

### Callback Helpers

- **eSewa**: `payment.handleCallback('esewa', { data: encodedString })`
  - Decodes Base64 response, validates HMAC SHA256 signature, re-emits normalized payload.
- **Khalti**: `payment.handleCallback('khalti', { query: req.query, body: req.body })`
  - Extracts `pidx`, calls lookup API, and only emits success after Khalti confirms `Completed`.

## Provider Configuration

### eSewa

| Field | Required | Description |
| ----- | -------- | ----------- |
| `merchantId` | ✅ | Merchant account identifier |
| `productCode` | ✅ | Unique product code from eSewa |
| `secretKey` | ✅ | Shared secret for signature generation |
| `successUrl` / `failureUrl` | ✅ | Redirect endpoints (GET) |
| `env` | ✅ | `sandbox` or `production`; selects base/status URLs |

### Khalti (Web Checkout)

| Field | Required | Description |
| ----- | -------- | ----------- |
| `publicKey` | ✅ | Client key (if you embed Khalti scripts) |
| `secretKey` | ✅ | Server key for Authorization header (`Key <secret>`) |
| `returnUrl` | ✅ | Callback URL receiving `pidx` + status |
| `websiteUrl` | ✅ | Public-facing domain (required by API) |
| `env` | ✅ | `sandbox` or `production`; selects API base |

## Usage Patterns

### Initiate Khalti Payment

```js
await payment.initiate('khalti', {
  amount: 1500,
  purchaseOrderId: 'INV-42',
  purchaseOrderName: 'Course Subscription',
  amountBreakdown: [
    { label: 'Subtotal', amount: 1200 },
    { label: 'VAT', amount: 300 }
  ],
  customerInfo: {
    name: 'Aarav Gurung',
    email: 'aarav@example.com',
    phone: '9800000001'
  }
});
```

### Verify Payment

```js
await payment.verify('khalti', { pidx: 'bZQLD9wRVWo4CdESSfuSsB' });
await payment.verify('esewa', { transactionUuid: 'order-2401', totalAmount: 1000 });
```

### Manual Callback Processing

```js
app.get('/payments/khalti/callback', async (req, res) => {
  try {
    const normalized = await payment.handleCallback('khalti', { query: req.query });
    res.redirect(`/thank-you?txn=${normalized.transactionId}`);
  } catch (error) {
    res.redirect('/payment-error');
  }
});
```

## Error Handling

| Error | When it occurs |
| ----- | -------------- |
| `InvalidConfigError` | Missing/invalid provider config or malformed initiate payload |
| `VerificationFailedError` | Signature mismatch, missing `pidx`, failed lookup result |
| `HttpRequestError` | Axios error wrapped with safe `status` + `data` metadata |

Always wrap SDK calls:

```js
try {
  const verify = await payment.verify('khalti', { pidx });
  if (verify.status !== 'SUCCESS') {
    // queue retry or notify support
  }
} catch (error) {
  // log, raise incident, etc.
}
```

## Supported Providers & Roadmap

| Provider | Status | Notes |
| -------- | ------ | ----- |
| eSewa | ✅ | Initiate, callback signature validation, status check |
| Khalti | ✅ | Web checkout initiate, lookup verification, callback bridge |

## Contributing

1. Fork the repo and create a feature branch.
2. Implement or extend a provider that follows the `PaymentProvider` interface (`initiatePayment`, `verifyPayment`, optional `refund` or `handleCallback`).
3. Run `npm run lint`.
4. Submit a PR with testing notes, sample payloads, and docs updates if needed.

## License

MIT © Contributors to NepalPay SDK
