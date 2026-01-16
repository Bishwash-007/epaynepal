import { PaymentStatus } from "../../core/types.js";

/**
 * Maps IME Pay payment initiation response to unified NepalPay format
 */
export const mapInitResponse = ({ paymentUrl, transactionId, amount, config }) => ({
  provider: "imepay",
  transactionId,
  amount: Number(amount),
  currency: config.currency,
  status: PaymentStatus.PENDING,
  redirectUrl: paymentUrl,
  raw: { paymentUrl, transactionId }
});

/**
 * Maps IME Pay payment verification response to unified NepalPay format
 */
export const mapVerificationResponse = (response) => {
  let status = PaymentStatus.FAILED;

  if (response.ResponseCode === "0" || response.status === "SUCCESS") {
    status = PaymentStatus.SUCCESS;
  }

  return {
    provider: "imepay",
    transactionId: response.TransactionId || response.transactionId,
    status,
    referenceId: response.RefId || response.referenceId,
    raw: response
  };
};
