import { z } from "zod";
import { mapInitResponse, mapVerificationResponse } from "./imepay.mapper.js";
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
  refId: z.string().optional(),
});

const callbackSchema = z.object({
  ResponseCode: z.string().optional(),
  TransactionId: z.string().optional(),
  RefId: z.string().optional(),
  status: z.string().optional(),
  transactionId: z.string().optional(),
  referenceId: z.string().optional(),
  body: z.any().optional(),
});

export class ImePayAdapter {
  constructor(config, deps = {}) {
    this.config = config;
    this.logger = deps.logger || console;
    this.http = deps.httpClient || createHttpClient({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async initiatePayment(payload = {}) {
    const data = initiateSchema.parse(payload);

    const requestBody = {
      MerchantCode: this.config.merchantCode,
      MerchantName: this.config.merchantName,
      UserName: this.config.username,
      Password: this.config.password,
      Module: this.config.module,
      TransactionId: data.transactionId,
      Amount: data.amount,
      Currency: this.config.currency,
      SuccessUrl: this.config.successUrl,
      FailureUrl: this.config.failureUrl,
      Remarks: data.remarks || `Payment for ${data.transactionId}`,
      Particular: data.particular || data.transactionId,
      CustomerName: data.customerName,
      CustomerEmail: data.customerEmail,
      CustomerMobile: data.customerMobile,
      ...data.additionalFields
    };

    this.logger.debug?.("IME Pay initiate payload prepared");

    // IME Pay typically returns a payment URL
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
      MerchantCode: this.config.merchantCode,
      UserName: this.config.username,
      Password: this.config.password,
      TransactionId: data.transactionId,
      RefId: data.refId,
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

    if (!callbackData.TransactionId && !callbackData.transactionId) {
      throw new VerificationFailedError("IME Pay callback missing transactionId");
    }

    return mapVerificationResponse(callbackData);
  }
}
