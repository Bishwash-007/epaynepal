import { PaymentStatus } from "../../core/types.js";

/**
 * Maps Global IME payment initiation response to unified NepalPay format
 */
export const mapInitResponse = ({ paymentUrl, transactionId, amount, config }) => ({
  provider: "globalime",
  transactionId,
  amount: Number(amount),
  currency: config.currency,
  status: PaymentStatus.PENDING,
  redirectUrl: paymentUrl,
  raw: { paymentUrl, transactionId }
});

/**
 * Maps Global IME payment verification response to unified NepalPay format
 */
export const mapVerificationResponse = (response) => {
  let status = PaymentStatus.FAILED;

  if (response.success === true || response.status === "SUCCESS" || response.responseCode === "00") {
    status = PaymentStatus.SUCCESS;
  }

  return {
    provider: "globalime",
    transactionId: response.transactionId || response.txnId,
    status,
    referenceId: response.referenceId || response.refId,
    raw: response
  };
};
