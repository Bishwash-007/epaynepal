import { z } from "zod";
import { mapInitResponse, mapVerificationResponse } from "./connectips.mapper.js";
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
});

const callbackSchema = z.object({
  status: z.string(),
  transactionId: z.string(),
  refId: z.string().optional(),
  amount: amountSchema.optional(),
  body: z.any().optional(),
});

export class ConnectIpsAdapter {
  constructor(config, deps = {}) {
    this.config = config;
    this.logger = deps.logger || console;
    this.http = deps.httpClient || createHttpClient({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.config.appId,
        'X-App-Secret': this.config.appSecret,
        'X-Username': this.config.username
      }
    });
  }

  async initiatePayment(payload = {}) {
    const data = initiateSchema.parse(payload);

    const requestBody = {
      merchantId: this.config.merchantId,
      appId: this.config.appId,
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

    this.logger.debug?.("ConnectIPS initiate payload prepared");

    // ConnectIPS typically returns a payment URL directly
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

    const params = {
      merchantId: this.config.merchantId,
      transactionId: data.transactionId,
    };

    const response = await requestWithHandling(this.http, {
      method: "get",
      url: this.config.statusUrl,
      params,
    });

    return mapVerificationResponse(response);
  }

  async handleCallback(payload = {}) {
    const parsed = callbackSchema.parse(payload);
    const callbackData = parsed.body || parsed;

    if (!callbackData.transactionId) {
      throw new VerificationFailedError("ConnectIPS callback missing transactionId");
    }

    // For ConnectIPS, callback usually contains the final status
    return mapVerificationResponse(callbackData);
  }
}
