import { z } from "zod";
import { mapInitResponse, mapVerificationResponse } from "./esewa.mapper.js";
import {
  buildSignedFieldString,
  decodeBase64Json,
  generateHmacBase64,
  verifyHmacSignature,
} from "../../utils/crypto.js";
import { createHttpClient, requestWithHandling } from "../../utils/http.js";
import { VerificationFailedError } from "../../core/errors.js";

const amountSchema = z.coerce.number().nonnegative();

const initiateSchema = z.object({
  amount: amountSchema.positive(),
  taxAmount: amountSchema.default(0),
  productServiceCharge: amountSchema.default(0),
  productDeliveryCharge: amountSchema.default(0),
  totalAmount: amountSchema.optional(),
  transactionUuid: z.string().min(1),
  productCode: z.string().optional(),
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
  additionalFields: z.record(z.any()).optional(),
});

const verifySchema = z.object({
  transactionUuid: z.string().min(1),
  totalAmount: amountSchema.optional(),
  amount: amountSchema.optional(),
  productCode: z.string().optional(),
});

const callbackSchema = z.object({
  encoded: z.string().optional(),
  data: z.string().optional(),
  body: z.any().optional(),
});

const formatAmount = (value) => {
  const normalized = Number(value ?? 0);
  return Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(2);
};

export class EsewaAdapter {
  constructor(config, deps = {}) {
    this.config = config;
    this.logger = deps.logger || console;
    this.http =
      deps.httpClient || createHttpClient({ timeout: config.timeout });
  }

  async initiatePayment(payload = {}) {
    const data = initiateSchema.parse(payload);
    const formFields = this.#buildFormFields(data);
    this.logger.debug?.("eSewa initiate payload generated");
    return mapInitResponse({ formFields, config: this.config });
  }

  async verifyPayment(payload = {}) {
    const data = verifySchema.parse(payload);
    const totalAmount = data.totalAmount ?? data.amount;
    const params = {
      product_code: data.productCode || this.config.productCode,
      transaction_uuid: data.transactionUuid,
      total_amount: totalAmount ? formatAmount(totalAmount) : undefined,
    };

    if (!params.total_amount) {
      throw new VerificationFailedError(
        "totalAmount is required to verify eSewa payment"
      );
    }

    const response = await requestWithHandling(this.http, {
      method: "get",
      url: this.config.statusUrl,
      params,
    });

    return mapVerificationResponse(response);
  }

  async handleCallback(payload = {}) {
    const parsed = callbackSchema.parse(payload);
    const encodedPayload =
      parsed.encoded || parsed.data || parsed.body?.data || parsed.body;
    if (typeof encodedPayload !== "string") {
      throw new VerificationFailedError(
        "Unable to locate encoded callback payload"
      );
    }
    const decoded = decodeBase64Json(encodedPayload);
    this.#assertCallbackSignature(decoded);
    return mapVerificationResponse(decoded);
  }

  #buildFormFields(data) {
    const totalAmount =
      data.totalAmount ??
      data.amount +
        data.taxAmount +
        data.productServiceCharge +
        data.productDeliveryCharge;

    const fields = {
      amount: formatAmount(data.amount),
      tax_amount: formatAmount(data.taxAmount),
      product_service_charge: formatAmount(data.productServiceCharge),
      product_delivery_charge: formatAmount(data.productDeliveryCharge),
      total_amount: formatAmount(totalAmount),
      transaction_uuid: data.transactionUuid,
      product_code: data.productCode || this.config.productCode,
      success_url: data.successUrl || this.config.successUrl,
      failure_url: data.failureUrl || this.config.failureUrl,
      signed_field_names: this.config.signedFieldNames,
    };

    if (data.additionalFields) {
      Object.assign(fields, data.additionalFields);
    }

    const message = buildSignedFieldString(
      fields,
      this.config.signedFieldNames
    );
    fields.signature = generateHmacBase64(this.config.secretKey, message);
    return fields;
  }

  #assertCallbackSignature(decoded) {
    const signedFields = decoded.signed_field_names;
    const message = buildSignedFieldString(decoded, signedFields);
    const isValid = verifyHmacSignature(
      this.config.secretKey,
      message,
      decoded.signature
    );
    if (!isValid) {
      throw new VerificationFailedError("Invalid eSewa callback signature");
    }
  }
}
