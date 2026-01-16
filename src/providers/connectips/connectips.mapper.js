import { PaymentStatus } from "../../core/types.js";

/**
 * Maps ConnectIPS payment initiation response to unified NepalPay format
 */
export const mapInitResponse = ({ paymentUrl, transactionId, amount, config }) => ({
  provider: "connectips",
  transactionId,
  amount: Number(amount),
  currency: config.currency,
  status: PaymentStatus.PENDING,
  redirectUrl: paymentUrl,
  raw: { paymentUrl, transactionId }
});

/**
 * Maps ConnectIPS payment verification response to unified NepalPay format
 */
export const mapVerificationResponse = (response) => {
  const status = response.status === "SUCCESS" ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

  return {
    provider: "connectips",
    transactionId: response.transactionId || response.refId,
    status,
    referenceId: response.refId || response.transactionId,
    raw: response
  };
};
