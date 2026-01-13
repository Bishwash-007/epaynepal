import { z } from "zod";
import {
  mapKhaltiInitResponse,
  mapKhaltiVerificationResponse,
} from "./khalti.mapper.js";
import { createHttpClient, requestWithHandling } from "../../utils/http.js";
import {
  InvalidConfigError,
  VerificationFailedError,
} from "../../core/errors.js";

const amountSchema = z.coerce.number().positive();

const initiateSchema = z.object({
  amount: amountSchema,
  purchaseOrderId: z.string().min(1),
  purchaseOrderName: z.string().min(1),
  returnUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  customerInfo: z
    .object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(6).optional(),
    })
    .partial()
    .optional(),
  amountBreakdown: z
    .array(
      z.object({
        label: z.string().min(1),
        amount: amountSchema,
      })
    )
    .optional(),
  productDetails: z
    .array(
      z.object({
        identity: z.string().min(1),
        name: z.string().min(1),
        totalPrice: amountSchema,
        quantity: z.number().int().positive(),
        unitPrice: amountSchema,
      })
    )
    .optional(),
  merchantData: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const verifySchema = z
  .object({
    pidx: z.string().min(1).optional(),
    transactionId: z.string().min(1).optional(),
  })
  .refine((value) => value.pidx || value.transactionId, {
    message: "Provide pidx or transactionId to verify Khalti payment",
  });

const callbackSchema = z.union([
  z.object({ query: z.record(z.any()), body: z.record(z.any()).optional() }),
  z.object({ body: z.record(z.any()), query: z.record(z.any()).optional() }),
  z.record(z.any()),
]);

const toPaisa = (amount) => Math.round(Number(amount) * 100);

export class KhaltiAdapter {
  constructor(config, deps = {}) {
    this.config = config;
    this.logger = deps.logger || console;
    this.http =
      deps.httpClient ||
      createHttpClient({
        baseURL: this.config.baseUrl,
        timeout: this.config.timeout,
      });
  }

  async initiatePayment(payload = {}) {
    const data = initiateSchema.parse(payload);
    const requestBody = this.#buildInitiatePayload(data);
    const response = await requestWithHandling(this.http, {
      method: "post",
      url: this.config.initiatePath,
      data: requestBody,
      headers: this.#authHeaders(),
    });

    return mapKhaltiInitResponse({
      request: requestBody,
      response,
      amount: Number(data.amount),
      currency: this.config.currency,
    });
  }

  async verifyPayment(payload = {}) {
    const data = verifySchema.parse(payload);
    const requestBody = { pidx: data.pidx || data.transactionId };
    const lookup = await requestWithHandling(this.http, {
      method: "post",
      url: this.config.lookupPath,
      data: requestBody,
      headers: this.#authHeaders(),
    });

    return mapKhaltiVerificationResponse(lookup);
  }

  async handleCallback(payload = {}) {
    const parsed = callbackSchema.parse(payload);
    const source = this.#extractCallbackPayload(parsed);

    if (!source?.pidx) {
      throw new VerificationFailedError(
        "Khalti callback payload is missing pidx"
      );
    }

    const verification = await this.verifyPayment({ pidx: source.pidx });
    const { raw, ...rest } = verification;

    return {
      ...rest,
      raw: {
        lookup: raw,
        callback: source,
      },
    };
  }

  #buildInitiatePayload(data) {
    const returnUrl = data.returnUrl || this.config.returnUrl;
    const websiteUrl = data.websiteUrl || this.config.websiteUrl;

    if (!returnUrl || !websiteUrl) {
      throw new InvalidConfigError(
        "returnUrl and websiteUrl are required for Khalti payments"
      );
    }

    const payload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: toPaisa(data.amount),
      purchase_order_id: data.purchaseOrderId,
      purchase_order_name: data.purchaseOrderName,
    };

    if (data.customerInfo) {
      const customer = this.#compactObject({
        name: data.customerInfo.name,
        email: data.customerInfo.email,
        phone: data.customerInfo.phone,
      });
      if (Object.keys(customer).length) {
        payload.customer_info = customer;
      }
    }

    if (data.amountBreakdown?.length) {
      payload.amount_breakdown = data.amountBreakdown.map((item) => ({
        label: item.label,
        amount: toPaisa(item.amount),
      }));
    }

    if (payload.amount_breakdown) {
      const breakdownTotal = payload.amount_breakdown.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      if (breakdownTotal !== payload.amount) {
        throw new InvalidConfigError(
          "Sum of amountBreakdown must equal amount in paisa for Khalti"
        );
      }
    }

    if (data.productDetails?.length) {
      payload.product_details = data.productDetails.map((item) => ({
        identity: item.identity,
        name: item.name,
        total_price: toPaisa(item.totalPrice),
        quantity: item.quantity,
        unit_price: toPaisa(item.unitPrice),
      }));
    }

    if (data.merchantData) {
      for (const [key, value] of Object.entries(data.merchantData)) {
        const field = key.startsWith("merchant_") ? key : `merchant_${key}`;
        payload[field] = value;
      }
    }

    if (data.metadata) {
      payload.metadata = data.metadata;
    }

    return payload;
  }

  #extractCallbackPayload(value) {
    if (value.query && Object.keys(value.query).length) {
      return value.query;
    }
    if (value.body && Object.keys(value.body).length) {
      return value.body;
    }
    return value;
  }

  #authHeaders() {
    return { Authorization: `Key ${this.config.secretKey}` };
  }

  #compactObject(target) {
    return Object.entries(target || {}).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
  }
}
