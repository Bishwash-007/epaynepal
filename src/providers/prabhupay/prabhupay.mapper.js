import { PaymentStatus } from "../../core/types.js";

/**
 * Maps Prabhu Pay payment initiation response to unified NepalPay format
 */
export const mapInitResponse = ({ paymentUrl, transactionId, amount, config }) => ({
  provider: "prabhupay",
  transactionId,
  amount: Number(amount),
  currency: config.currency,
  status: PaymentStatus.PENDING,
  redirectUrl: paymentUrl,
  raw: { paymentUrl, transactionId }
});

/**
 * Maps Prabhu Pay payment verification response to unified NepalPay format
 */
export const mapVerificationResponse = (response) => {
  let status = PaymentStatus.FAILED;

  if (response.success === true || response.status === "COMPLETED" || response.code === "00") {
    status = PaymentStatus.SUCCESS;
  }

  return {
    provider: "prabhupay",
    transactionId: response.transactionId || response.txnId,
    status,
    referenceId: response.referenceId || response.refId,
    raw: response
  };
};
