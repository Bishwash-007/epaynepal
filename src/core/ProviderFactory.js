import { z } from "zod/v4";
import { EsewaAdapter } from "../providers/esewa/esewa.adapter.js";
import { buildEsewaConfig } from "../providers/esewa/esewa.config.js";
import { KhaltiAdapter } from "../providers/khalti/khalti.adapter.js";
import { buildKhaltiConfig } from "../providers/khalti/khalti.config.js";
import { ConnectIpsAdapter } from "../providers/connectips/connectips.adapter.js";
import { buildConnectIpsConfig } from "../providers/connectips/connectips.config.js";
import { ImePayAdapter } from "../providers/imepay/imepay.adapter.js";
import { buildImePayConfig } from "../providers/imepay/imepay.config.js";
import { PrabhuPayAdapter } from "../providers/prabhupay/prabhupay.adapter.js";
import { buildPrabhuPayConfig } from "../providers/prabhupay/prabhupay.config.js";
import { GlobalImeAdapter } from "../providers/globalime/globalime.adapter.js";
import { buildGlobalImeConfig } from "../providers/globalime/globalime.config.js";
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

    if (config.connectips) {
      providers.connectips = new ConnectIpsAdapter(
        buildConnectIpsConfig(config.connectips),
        deps
      );
    }

    if (config.imepay) {
      providers.imepay = new ImePayAdapter(buildImePayConfig(config.imepay), deps);
    }

    if (config.prabhupay) {
      providers.prabhupay = new PrabhuPayAdapter(
        buildPrabhuPayConfig(config.prabhupay),
        deps
      );
    }

    if (config.globalime) {
      providers.globalime = new GlobalImeAdapter(
        buildGlobalImeConfig(config.globalime),
        deps
      );
    }

    return providers;
  }
}
