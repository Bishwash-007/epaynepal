import { z } from "zod/v4";
import { EsewaAdapter } from "../providers/esewa/esewa.adapter.js";
import { buildEsewaConfig } from "../providers/esewa/esewa.config.js";
import { KhaltiAdapter } from "../providers/khalti/khalti.adapter.js";
import { buildKhaltiConfig } from "../providers/khalti/khalti.config.js";
export class ProviderFactory {
  static create(config = {}, deps = {}) {
    const providers = {};

    if (config.esewa) {
      providers.esewa = new EsewaAdapter(buildEsewaConfig(config.esewa), deps);
    }

    if (config.khalti) {
      providers.khalti = new KhaltiAdapter(
        buildKhaltiConfig(config.khalti),
        deps
      );
    }

    return providers;
  }
}
