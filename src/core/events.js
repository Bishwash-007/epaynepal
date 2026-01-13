import { EventEmitter } from "node:events";
import { PaymentEvents } from "./types.js";

export class NepalPayEvents extends EventEmitter {
  emitPending(payload) {
    this.emit(PaymentEvents.PAYMENT_INITIATED, payload);
  }

  emitSuccess(payload) {
    this.emit(PaymentEvents.PAYMENT_SUCCESS, payload);
  }

  emitFailure(payload) {
    this.emit(PaymentEvents.PAYMENT_FAILED, payload);
  }
}

export { PaymentEvents };
