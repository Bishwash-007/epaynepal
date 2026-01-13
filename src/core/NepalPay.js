import { ProviderFactory } from "./ProviderFactory.js";
import { ProviderNotSupportedError } from "./errors.js";
import { NepalPayEvents } from "./events.js";
import { PaymentStatus } from "./types.js";
import { createLogger } from "../utils/logger.js";

export class NepalPay {
  constructor(config = {}, options = {}) {
    this.logger = options.logger || createLogger(options.loggerOptions);
    this.events = options.events || new NepalPayEvents();
    this.providers = ProviderFactory.create(config, {
      logger: this.logger,
      events: this.events,
    });
  }

  on(event, handler) {
    this.events.on(event, handler);
  }

  off(event, handler) {
    this.events.off(event, handler);
  }

  async initiate(providerKey, payload) {
    const provider = this.#getProvider(providerKey);
    const response = await provider.initiatePayment(payload);
    this.events.emitPending(response);
    return response;
  }

  async verify(providerKey, payload) {
    const provider = this.#getProvider(providerKey);
    const response = await provider.verifyPayment(payload);
    this.#emitByStatus(response);
    return response;
  }

  async refund(providerKey, payload) {
    const provider = this.#getProvider(providerKey);
    if (typeof provider.refund !== "function") {
      throw new ProviderNotSupportedError(
        `Refund not supported for provider ${providerKey}`
      );
    }
    const response = await provider.refund(payload);
    this.#emitByStatus(response);
    return response;
  }

  async handleCallback(providerKey, payload) {
    const provider = this.#getProvider(providerKey);
    if (typeof provider.handleCallback !== "function") {
      throw new ProviderNotSupportedError(
        `Callback handling not available for provider ${providerKey}`
      );
    }
    const response = await provider.handleCallback(payload);
    this.#emitByStatus(response);
    return response;
  }

  #getProvider(providerKey) {
    const provider = this.providers[providerKey];
    if (!provider) {
      throw new ProviderNotSupportedError(
        `Provider ${providerKey} is not configured`
      );
    }
    return provider;
  }

  #emitByStatus(payload) {
    if (!payload?.status) {
      return;
    }
    if (payload.status === PaymentStatus.SUCCESS) {
      this.events.emitSuccess(payload);
    } else if (payload.status === PaymentStatus.FAILED) {
      this.events.emitFailure(payload);
    } else {
      this.events.emitPending(payload);
    }
  }
}

export default NepalPay;
