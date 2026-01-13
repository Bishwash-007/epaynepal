import { PaymentStatus, Providers } from "../../core/types.js";

const SUCCESS_STATUSES = new Set(["Completed"]);
const PENDING_STATUSES = new Set(["Pending", "Initiated"]);

const resolveStatus = (status) => {
  if (SUCCESS_STATUSES.has(status)) {
    return PaymentStatus.SUCCESS;
  }
  if (PENDING_STATUSES.has(status)) {
    return PaymentStatus.PENDING;
  }
  return PaymentStatus.FAILED;
};

export const mapKhaltiInitResponse = ({ request, response, amount, currency }) => ({
  provider: Providers.KHALTI,
  transactionId: response.pidx,
  amount,
  currency,
  status: PaymentStatus.PENDING,
  redirectUrl: response.payment_url,
  raw: {
    request,
    response,
  },
});

export const mapKhaltiVerificationResponse = (lookup) => ({
  provider: Providers.KHALTI,
  transactionId: lookup.pidx,
  status: resolveStatus(lookup.status),
  referenceId: lookup.transaction_id || undefined,
  raw: lookup,
});
