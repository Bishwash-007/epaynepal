import { Providers, PaymentStatus } from "../../core/types.js";

export const mapInitResponse = ({ formFields, config }) => ({
  provider: Providers.ESEWA,
  transactionId: formFields.transaction_uuid,
  amount: Number(formFields.total_amount),
  currency: config.currency,
  status: PaymentStatus.PENDING,
  redirectUrl: config.formUrl,
  raw: {
    url: config.formUrl,
    method: "POST",
    fields: formFields,
  },
});

const SUCCESS_STATUSES = new Set(["COMPLETE"]);

export const mapVerificationResponse = (payload) => ({
  provider: Providers.ESEWA,
  transactionId: payload.transaction_uuid,
  status: SUCCESS_STATUSES.has(payload.status)
    ? PaymentStatus.SUCCESS
    : PaymentStatus.FAILED,
  referenceId: payload.ref_id || undefined,
  raw: payload,
});
