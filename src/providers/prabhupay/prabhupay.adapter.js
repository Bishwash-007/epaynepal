import { z } from "zod";
import { mapInitResponse, mapVerificationResponse } from "./prabhupay.mapper.js";
import { createHttpClient, requestWithHandling } from "../../utils/http.js";
import { VerificationFailedError } from "../../core/errors.js";

const amountSchema = z.coerce.number().nonnegative();

const initiateSchema = z.object({
  amount: amountSchema.positive(),
  transactionId: z.string().min(1),
  remarks: z.string().optional(),
  particular: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerMobile: z.string().optional(),
  additionalFields: z.record(z.any()).optional(),
});

const verifySchema = z.object({
  transactionId: z.string().min(1),
  referenceId: z.string().optional(),
});

const callbackSchema = z.object({
  success: z.boolean().optional(),
  status: z.string().optional(),
  code: z.string().optional(),
  transactionId: z.string().optional(),
  txnId: z.string().optional(),
  referenceId: z.string().optional(),
  refId: z.string().optional(),
  body: z.any().optional(),
});

export class PrabhuPayAdapter {
  constructor(config, deps = {}) {
    this.config = config;
    this.logger = deps.logger || console;
    this.http = deps.httpClient || createHttpClient({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
  }

  async initiatePayment(payload = {}) {
    const data = initiateSchema.parse(payload);

    const requestBody = {
      merchantId: this.config.merchantId,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: this.config.currency,
      successUrl: this.config.successUrl,
      failureUrl: this.config.failureUrl,
      remarks: data.remarks || `Payment for ${data.transactionId}`,
      particular: data.particular || data.transactionId,
      customerInfo: {
        name: data.customerName,
        email: data.customerEmail,
        mobile: data.customerMobile,
      },
      ...data.additionalFields
    };

    this.logger.debug?.("Prabhu Pay initiate payload prepared");

    // Prabhu Pay typically returns a payment URL
    const paymentUrl = `${this.config.baseUrl}/payment/initiate`;

    return mapInitResponse({
      paymentUrl,
      transactionId: data.transactionId,
      amount: data.amount,
      config: this.config
    });
  }

  async verifyPayment(payload = {}) {
    const data = verifySchema.parse(payload);

    const requestBody = {
      merchantId: this.config.merchantId,
      transactionId: data.transactionId,
      referenceId: data.referenceId,
    };

    const response = await requestWithHandling(this.http, {
      method: "post",
      url: "/api/verify",
      data: requestBody,
    });

    return mapVerificationResponse(response);
  }

  async handleCallback(payload = {}) {
    const parsed = callbackSchema.parse(payload);
    const callbackData = parsed.body || parsed;

    if (!callbackData.transactionId && !callbackData.txnId) {
      throw new VerificationFailedError("Prabhu Pay callback missing transactionId");
    }

    return mapVerificationResponse(callbackData);
  }
}
