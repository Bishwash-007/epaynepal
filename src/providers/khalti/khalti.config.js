import { z } from "zod";
import { InvalidConfigError } from "../../core/errors.js";

const BASE_URLS = {
  sandbox: "https://dev.khalti.com/api/v2",
  production: "https://khalti.com/api/v2",
};

const configSchema = z.object({
  publicKey: z.string().min(1, "publicKey is required"),
  secretKey: z.string().min(1, "secretKey is required"),
  returnUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  env: z.enum(["sandbox", "production"]).default("sandbox"),
  baseUrl: z.string().url().optional(),
  currency: z.literal("NPR").default("NPR"),
  timeout: z.number().int().positive().max(60000).default(10000),
});

const trimTrailingSlash = (value) => value.replace(/\/$/, "");

export const buildKhaltiConfig = (input = {}) => {
  try {
    const env = input.env || "sandbox";
    const defaults = {
      baseUrl: BASE_URLS[env],
    };
    const parsed = configSchema.parse({ ...defaults, ...input });
    const normalizedBase = trimTrailingSlash(parsed.baseUrl);

    return {
      ...parsed,
      baseUrl: normalizedBase,
      initiatePath: "/epayment/initiate/",
      lookupPath: "/epayment/lookup/",
    };
  } catch (error) {
    throw new InvalidConfigError("Invalid Khalti configuration", {
      cause: error,
    });
  }
};
