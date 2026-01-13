class SDKError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = this.constructor.name;
    this.meta = meta;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class InvalidConfigError extends SDKError {}
export class VerificationFailedError extends SDKError {}
export class ProviderNotSupportedError extends SDKError {}
export class SignatureMismatchError extends SDKError {}

export class HttpRequestError extends SDKError {
  constructor(message, meta = {}) {
    super(message, meta);
    this.status = meta.status;
    this.data = meta.data;
  }
}

export default SDKError;
