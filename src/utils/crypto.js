import { createHmac, timingSafeEqual } from 'node:crypto';

export const generateHmacBase64 = (secretKey, message) =>
  createHmac('sha256', secretKey).update(message).digest('base64');

export const buildSignedFieldString = (fields, signedFieldNames) => {
  const names = Array.isArray(signedFieldNames)
    ? signedFieldNames
    : String(signedFieldNames || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
  return names.map((name) => `${name}=${fields[name] ?? ''}`).join(',');
};

export const verifyHmacSignature = (secretKey, message, expectedSignature) => {
  const generated = generateHmacBase64(secretKey, message);
  const left = Buffer.from(generated);
  const right = Buffer.from(expectedSignature || '');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
};

export const decodeBase64Json = (encoded) => {
  const buffer = Buffer.from(encoded, 'base64');
  return JSON.parse(buffer.toString('utf8'));
};
