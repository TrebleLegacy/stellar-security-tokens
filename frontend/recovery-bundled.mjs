var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/base64url/dist/pad-string.js
var require_pad_string = __commonJS({
  "node_modules/base64url/dist/pad-string.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function padString(input) {
      var segmentLength = 4;
      var stringLength = input.length;
      var diff = stringLength % segmentLength;
      if (!diff) {
        return input;
      }
      var position = stringLength;
      var padLength = segmentLength - diff;
      var paddedStringLength = stringLength + padLength;
      var buffer = Buffer.alloc(paddedStringLength);
      buffer.write(input);
      while (padLength--) {
        buffer.write("=", position++);
      }
      return buffer.toString();
    }
    exports.default = padString;
  }
});

// node_modules/base64url/dist/base64url.js
var require_base64url = __commonJS({
  "node_modules/base64url/dist/base64url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var pad_string_1 = require_pad_string();
    function encode(input, encoding) {
      if (encoding === void 0) {
        encoding = "utf8";
      }
      if (Buffer.isBuffer(input)) {
        return fromBase64(input.toString("base64"));
      }
      return fromBase64(Buffer.from(input, encoding).toString("base64"));
    }
    function decode(base64url8, encoding) {
      if (encoding === void 0) {
        encoding = "utf8";
      }
      return Buffer.from(toBase64(base64url8), "base64").toString(encoding);
    }
    function toBase64(base64url8) {
      base64url8 = base64url8.toString();
      return pad_string_1.default(base64url8).replace(/\-/g, "+").replace(/_/g, "/");
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBuffer(base64url8) {
      return Buffer.from(toBase64(base64url8), "base64");
    }
    var base64url7 = encode;
    base64url7.encode = encode;
    base64url7.decode = decode;
    base64url7.toBase64 = toBase64;
    base64url7.fromBase64 = fromBase64;
    base64url7.toBuffer = toBuffer;
    exports.default = base64url7;
  }
});

// node_modules/base64url/index.js
var require_base64url2 = __commonJS({
  "node_modules/base64url/index.js"(exports, module) {
    module.exports = require_base64url().default;
    module.exports.default = module.exports;
  }
});

// node_modules/@simplewebauthn/browser/esm/helpers/bufferToBase64URLString.js
function bufferToBase64URLString(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  const base64String = btoa(str);
  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// node_modules/@simplewebauthn/browser/esm/helpers/base64URLStringToBuffer.js
function base64URLStringToBuffer(base64URLString) {
  const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - base64.length % 4) % 4;
  const padded = base64.padEnd(base64.length + padLength, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// node_modules/@simplewebauthn/browser/esm/helpers/browserSupportsWebAuthn.js
function browserSupportsWebAuthn() {
  return _browserSupportsWebAuthnInternals.stubThis(globalThis?.PublicKeyCredential !== void 0 && typeof globalThis.PublicKeyCredential === "function");
}
var _browserSupportsWebAuthnInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/browser/esm/helpers/toPublicKeyCredentialDescriptor.js
function toPublicKeyCredentialDescriptor(descriptor) {
  const { id } = descriptor;
  return {
    ...descriptor,
    id: base64URLStringToBuffer(id),
    /**
     * `descriptor.transports` is an array of our `AuthenticatorTransportFuture` that includes newer
     * transports that TypeScript's DOM lib is ignorant of. Convince TS that our list of transports
     * are fine to pass to WebAuthn since browsers will recognize the new value.
     */
    transports: descriptor.transports
  };
}

// node_modules/@simplewebauthn/browser/esm/helpers/isValidDomain.js
function isValidDomain(hostname) {
  return (
    // Consider localhost valid as well since it's okay wrt Secure Contexts
    hostname === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
  );
}

// node_modules/@simplewebauthn/browser/esm/helpers/webAuthnError.js
var WebAuthnError = class extends Error {
  constructor({ message, code, cause, name }) {
    super(message, { cause });
    Object.defineProperty(this, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.name = name ?? cause.name;
    this.code = code;
  }
};

// node_modules/@simplewebauthn/browser/esm/helpers/identifyRegistrationError.js
function identifyRegistrationError({ error, options }) {
  const { publicKey } = options;
  if (!publicKey) {
    throw Error("options was missing required publicKey property");
  }
  if (error.name === "AbortError") {
    if (options.signal instanceof AbortSignal) {
      return new WebAuthnError({
        message: "Registration ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: error
      });
    }
  } else if (error.name === "ConstraintError") {
    if (publicKey.authenticatorSelection?.requireResidentKey === true) {
      return new WebAuthnError({
        message: "Discoverable credentials were required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
        cause: error
      });
    } else if (
      // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
      options.mediation === "conditional" && publicKey.authenticatorSelection?.userVerification === "required"
    ) {
      return new WebAuthnError({
        message: "User verification was required during automatic registration but it could not be performed",
        code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
        cause: error
      });
    } else if (publicKey.authenticatorSelection?.userVerification === "required") {
      return new WebAuthnError({
        message: "User verification was required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
        cause: error
      });
    }
  } else if (error.name === "InvalidStateError") {
    return new WebAuthnError({
      message: "The authenticator was previously registered",
      code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
      cause: error
    });
  } else if (error.name === "NotAllowedError") {
    return new WebAuthnError({
      message: error.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  } else if (error.name === "NotSupportedError") {
    const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
    if (validPubKeyCredParams.length === 0) {
      return new WebAuthnError({
        message: 'No entry in pubKeyCredParams was of type "public-key"',
        code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
      code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
      cause: error
    });
  } else if (error.name === "SecurityError") {
    const effectiveDomain = globalThis.location.hostname;
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError({
        message: `${globalThis.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: error
      });
    } else if (publicKey.rp.id !== effectiveDomain) {
      return new WebAuthnError({
        message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
        code: "ERROR_INVALID_RP_ID",
        cause: error
      });
    }
  } else if (error.name === "TypeError") {
    if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
      return new WebAuthnError({
        message: "User ID was not between 1 and 64 characters",
        code: "ERROR_INVALID_USER_ID_LENGTH",
        cause: error
      });
    }
  } else if (error.name === "UnknownError") {
    return new WebAuthnError({
      message: "The authenticator was unable to process the specified options, or could not create a new credential",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: error
    });
  }
  return error;
}

// node_modules/@simplewebauthn/browser/esm/helpers/webAuthnAbortService.js
var BaseWebAuthnAbortService = class {
  constructor() {
    Object.defineProperty(this, "controller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
  }
  createNewAbortSignal() {
    if (this.controller) {
      const abortError = new Error("Cancelling existing WebAuthn API call for new one");
      abortError.name = "AbortError";
      this.controller.abort(abortError);
    }
    const newController = new AbortController();
    this.controller = newController;
    return newController.signal;
  }
  cancelCeremony() {
    if (this.controller) {
      const abortError = new Error("Manually cancelling existing WebAuthn API call");
      abortError.name = "AbortError";
      this.controller.abort(abortError);
      this.controller = void 0;
    }
  }
};
var WebAuthnAbortService = new BaseWebAuthnAbortService();

// node_modules/@simplewebauthn/browser/esm/helpers/toAuthenticatorAttachment.js
var attachments = ["cross-platform", "platform"];
function toAuthenticatorAttachment(attachment) {
  if (!attachment) {
    return;
  }
  if (attachments.indexOf(attachment) < 0) {
    return;
  }
  return attachment;
}

// node_modules/@simplewebauthn/browser/esm/methods/startRegistration.js
async function startRegistration(options) {
  if (!options.optionsJSON && options.challenge) {
    console.warn("startRegistration() was not called correctly. It will try to continue with the provided options, but this call should be refactored to use the expected call structure instead. See https://simplewebauthn.dev/docs/packages/browser#typeerror-cannot-read-properties-of-undefined-reading-challenge for more information.");
    options = { optionsJSON: options };
  }
  const { optionsJSON, useAutoRegister = false } = options;
  if (!browserSupportsWebAuthn()) {
    throw new Error("WebAuthn is not supported in this browser");
  }
  const publicKey = {
    ...optionsJSON,
    challenge: base64URLStringToBuffer(optionsJSON.challenge),
    user: {
      ...optionsJSON.user,
      id: base64URLStringToBuffer(optionsJSON.user.id)
    },
    excludeCredentials: optionsJSON.excludeCredentials?.map(toPublicKeyCredentialDescriptor)
  };
  const createOptions = {};
  if (useAutoRegister) {
    createOptions.mediation = "conditional";
  }
  createOptions.publicKey = publicKey;
  createOptions.signal = WebAuthnAbortService.createNewAbortSignal();
  let credential;
  try {
    credential = await navigator.credentials.create(createOptions);
  } catch (err) {
    throw identifyRegistrationError({ error: err, options: createOptions });
  }
  if (!credential) {
    throw new Error("Registration was not completed");
  }
  const { id, rawId, response, type } = credential;
  let transports = void 0;
  if (typeof response.getTransports === "function") {
    transports = response.getTransports();
  }
  let responsePublicKeyAlgorithm = void 0;
  if (typeof response.getPublicKeyAlgorithm === "function") {
    try {
      responsePublicKeyAlgorithm = response.getPublicKeyAlgorithm();
    } catch (error) {
      warnOnBrokenImplementation("getPublicKeyAlgorithm()", error);
    }
  }
  let responsePublicKey = void 0;
  if (typeof response.getPublicKey === "function") {
    try {
      const _publicKey = response.getPublicKey();
      if (_publicKey !== null) {
        responsePublicKey = bufferToBase64URLString(_publicKey);
      }
    } catch (error) {
      warnOnBrokenImplementation("getPublicKey()", error);
    }
  }
  let responseAuthenticatorData;
  if (typeof response.getAuthenticatorData === "function") {
    try {
      responseAuthenticatorData = bufferToBase64URLString(response.getAuthenticatorData());
    } catch (error) {
      warnOnBrokenImplementation("getAuthenticatorData()", error);
    }
  }
  return {
    id,
    rawId: bufferToBase64URLString(rawId),
    response: {
      attestationObject: bufferToBase64URLString(response.attestationObject),
      clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
      transports,
      publicKeyAlgorithm: responsePublicKeyAlgorithm,
      publicKey: responsePublicKey,
      authenticatorData: responseAuthenticatorData
    },
    type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: toAuthenticatorAttachment(credential.authenticatorAttachment)
  };
}
function warnOnBrokenImplementation(methodName, cause) {
  console.warn(`The browser extension that intercepted this WebAuthn API call incorrectly implemented ${methodName}. You should report this error to them.
`, cause);
}

// node_modules/@simplewebauthn/browser/esm/helpers/browserSupportsWebAuthnAutofill.js
function browserSupportsWebAuthnAutofill() {
  if (!browserSupportsWebAuthn()) {
    return _browserSupportsWebAuthnAutofillInternals.stubThis(new Promise((resolve) => resolve(false)));
  }
  const globalPublicKeyCredential = globalThis.PublicKeyCredential;
  if (globalPublicKeyCredential?.isConditionalMediationAvailable === void 0) {
    return _browserSupportsWebAuthnAutofillInternals.stubThis(new Promise((resolve) => resolve(false)));
  }
  return _browserSupportsWebAuthnAutofillInternals.stubThis(globalPublicKeyCredential.isConditionalMediationAvailable());
}
var _browserSupportsWebAuthnAutofillInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/browser/esm/helpers/identifyAuthenticationError.js
function identifyAuthenticationError({ error, options }) {
  const { publicKey } = options;
  if (!publicKey) {
    throw Error("options was missing required publicKey property");
  }
  if (error.name === "AbortError") {
    if (options.signal instanceof AbortSignal) {
      return new WebAuthnError({
        message: "Authentication ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: error
      });
    }
  } else if (error.name === "NotAllowedError") {
    return new WebAuthnError({
      message: error.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  } else if (error.name === "SecurityError") {
    const effectiveDomain = globalThis.location.hostname;
    if (!isValidDomain(effectiveDomain)) {
      return new WebAuthnError({
        message: `${globalThis.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: error
      });
    } else if (publicKey.rpId !== effectiveDomain) {
      return new WebAuthnError({
        message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
        code: "ERROR_INVALID_RP_ID",
        cause: error
      });
    }
  } else if (error.name === "UnknownError") {
    return new WebAuthnError({
      message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: error
    });
  }
  return error;
}

// node_modules/@simplewebauthn/browser/esm/methods/startAuthentication.js
async function startAuthentication(options) {
  if (!options.optionsJSON && options.challenge) {
    console.warn("startAuthentication() was not called correctly. It will try to continue with the provided options, but this call should be refactored to use the expected call structure instead. See https://simplewebauthn.dev/docs/packages/browser#typeerror-cannot-read-properties-of-undefined-reading-challenge for more information.");
    options = { optionsJSON: options };
  }
  const { optionsJSON, useBrowserAutofill = false, verifyBrowserAutofillInput = true } = options;
  if (!browserSupportsWebAuthn()) {
    throw new Error("WebAuthn is not supported in this browser");
  }
  let allowCredentials;
  if (optionsJSON.allowCredentials?.length !== 0) {
    allowCredentials = optionsJSON.allowCredentials?.map(toPublicKeyCredentialDescriptor);
  }
  const publicKey = {
    ...optionsJSON,
    challenge: base64URLStringToBuffer(optionsJSON.challenge),
    allowCredentials
  };
  const getOptions = {};
  if (useBrowserAutofill) {
    if (!await browserSupportsWebAuthnAutofill()) {
      throw Error("Browser does not support WebAuthn autofill");
    }
    const eligibleInputs = document.querySelectorAll("input[autocomplete$='webauthn']");
    if (eligibleInputs.length < 1 && verifyBrowserAutofillInput) {
      throw Error('No <input> with "webauthn" as the only or last value in its `autocomplete` attribute was detected');
    }
    getOptions.mediation = "conditional";
    publicKey.allowCredentials = [];
  }
  getOptions.publicKey = publicKey;
  getOptions.signal = WebAuthnAbortService.createNewAbortSignal();
  let credential;
  try {
    credential = await navigator.credentials.get(getOptions);
  } catch (err) {
    throw identifyAuthenticationError({ error: err, options: getOptions });
  }
  if (!credential) {
    throw new Error("Authentication was not completed");
  }
  const { id, rawId, response, type } = credential;
  let userHandle = void 0;
  if (response.userHandle) {
    userHandle = bufferToBase64URLString(response.userHandle);
  }
  return {
    id,
    rawId: bufferToBase64URLString(rawId),
    response: {
      authenticatorData: bufferToBase64URLString(response.authenticatorData),
      clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
      signature: bufferToBase64URLString(response.signature),
      userHandle
    },
    type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: toAuthenticatorAttachment(credential.authenticatorAttachment)
  };
}

// node_modules/smart-account-kit/dist/kit.js
import { hash as hash8, Keypair as Keypair3, TransactionBuilder as TransactionBuilder4, rpc as rpc4, contract as contract2 } from "@stellar/stellar-sdk";

// node_modules/smart-account-kit/dist/storage/memory.js
var MemoryStorage = class {
  credentials = /* @__PURE__ */ new Map();
  session = null;
  async save(credential) {
    this.credentials.set(credential.credentialId, { ...credential });
  }
  async get(credentialId) {
    const credential = this.credentials.get(credentialId);
    return credential ? { ...credential } : null;
  }
  async getByContract(contractId) {
    const results = [];
    for (const credential of this.credentials.values()) {
      if (credential.contractId === contractId) {
        results.push({ ...credential });
      }
    }
    return results;
  }
  async getAll() {
    return Array.from(this.credentials.values()).map((c) => ({ ...c }));
  }
  async delete(credentialId) {
    this.credentials.delete(credentialId);
  }
  async update(credentialId, updates) {
    const credential = this.credentials.get(credentialId);
    if (credential) {
      this.credentials.set(credentialId, { ...credential, ...updates });
    }
  }
  async clear() {
    this.credentials.clear();
    this.session = null;
  }
  async saveSession(session) {
    this.session = { ...session };
  }
  async getSession() {
    return this.session ? { ...this.session } : null;
  }
  async clearSession() {
    this.session = null;
  }
};

// node_modules/smart-account-kit-bindings/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  Client: () => Client,
  CryptoError: () => CryptoError,
  MerkleDistributorError: () => MerkleDistributorError,
  PausableError: () => PausableError,
  SimpleThresholdError: () => SimpleThresholdError,
  SmartAccountError: () => SmartAccountError,
  SorobanFixedPointError: () => SorobanFixedPointError,
  SpendingLimitError: () => SpendingLimitError,
  UpgradeableError: () => UpgradeableError,
  WebAuthnError: () => WebAuthnError2,
  WeightedThresholdError: () => WeightedThresholdError,
  contract: () => contract,
  rpc: () => rpc
});
__reExport(dist_exports, stellar_sdk_star);
import { Buffer as Buffer2 } from "buffer";
import { Client as ContractClient, Spec as ContractSpec } from "@stellar/stellar-sdk/contract";
import * as stellar_sdk_star from "@stellar/stellar-sdk";
import * as contract from "@stellar/stellar-sdk/contract";
import * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer2;
}
var SmartAccountError = {
  /**
   * The specified context rule does not exist.
   */
  3e3: { message: "ContextRuleNotFound" },
  /**
   * A duplicate context rule already exists.
   */
  3001: { message: "DuplicateContextRule" },
  /**
   * The provided context cannot be validated against any rule.
   */
  3002: { message: "UnvalidatedContext" },
  /**
   * External signature verification failed.
   */
  3003: { message: "ExternalVerificationFailed" },
  /**
   * Context rule must have at least one signer or policy.
   */
  3004: { message: "NoSignersAndPolicies" },
  /**
   * The valid_until timestamp is in the past.
   */
  3005: { message: "PastValidUntil" },
  /**
   * The specified signer was not found.
   */
  3006: { message: "SignerNotFound" },
  /**
   * The signer already exists in the context rule.
   */
  3007: { message: "DuplicateSigner" },
  /**
   * The specified policy was not found.
   */
  3008: { message: "PolicyNotFound" },
  /**
   * The policy already exists in the context rule.
   */
  3009: { message: "DuplicatePolicy" },
  /**
   * Too many signers in the context rule.
   */
  3010: { message: "TooManySigners" },
  /**
   * Too many policies in the context rule.
   */
  3011: { message: "TooManyPolicies" },
  /**
   * Too many context rules in the smart account.
   */
  3012: { message: "TooManyContextRules" }
};
var SpendingLimitError = {
  /**
   * The smart account does not have a spending limit policy installed.
   */
  3220: { message: "SmartAccountNotInstalled" },
  /**
   * The spending limit has been exceeded.
   */
  3221: { message: "SpendingLimitExceeded" },
  /**
   * The spending limit or period is invalid.
   */
  3222: { message: "InvalidLimitOrPeriod" },
  /**
   * The transaction is not allowed by this policy.
   */
  3223: { message: "NotAllowed" },
  /**
   * The spending history has reached maximum capacity.
   */
  3224: { message: "HistoryCapacityExceeded" }
};
var SimpleThresholdError = {
  /**
   * The smart account does not have a simple threshold policy installed.
   */
  3200: { message: "SmartAccountNotInstalled" },
  /**
   * When threshold is 0 or exceeds the number of available signers.
   */
  3201: { message: "InvalidThreshold" },
  /**
   * The transaction is not allowed by this policy.
   */
  3202: { message: "NotAllowed" }
};
var WeightedThresholdError = {
  /**
   * The smart account does not have a weighted threshold policy installed.
   */
  3210: { message: "SmartAccountNotInstalled" },
  /**
   * The threshold value is invalid.
   */
  3211: { message: "InvalidThreshold" },
  /**
   * A mathematical operation would overflow.
   */
  3212: { message: "MathOverflow" },
  /**
   * The transaction is not allowed by this policy.
   */
  3213: { message: "NotAllowed" }
};
var WebAuthnError2 = {
  /**
   * The signature payload is invalid or has incorrect format.
   */
  3110: { message: "SignaturePayloadInvalid" },
  /**
   * The client data exceeds the maximum allowed length.
   */
  3111: { message: "ClientDataTooLong" },
  /**
   * Failed to parse JSON from client data.
   */
  3112: { message: "JsonParseError" },
  /**
   * The type field in client data is not "webauthn.get".
   */
  3113: { message: "TypeFieldInvalid" },
  /**
   * The challenge in client data does not match expected value.
   */
  3114: { message: "ChallengeInvalid" },
  /**
   * The authenticator data format is invalid or too short.
   */
  3115: { message: "AuthDataFormatInvalid" },
  /**
   * The User Present (UP) bit is not set in authenticator flags.
   */
  3116: { message: "PresentBitNotSet" },
  /**
   * The User Verified (UV) bit is not set in authenticator flags.
   */
  3117: { message: "VerifiedBitNotSet" },
  /**
   * Invalid relationship between Backup Eligibility and State bits.
   */
  3118: { message: "BackupEligibilityAndStateNotSet" }
};
var UpgradeableError = {
  /**
   * When migration is attempted but not allowed due to upgrade state.
   */
  1100: { message: "MigrationNotAllowed" }
};
var MerkleDistributorError = {
  /**
   * The merkle root is not set.
   */
  1300: { message: "RootNotSet" },
  /**
   * The provided index was already claimed.
   */
  1301: { message: "IndexAlreadyClaimed" },
  /**
   * The proof is invalid.
   */
  1302: { message: "InvalidProof" }
};
var SorobanFixedPointError = {
  /**
   * Arithmetic overflow occurred
   */
  1500: { message: "Overflow" },
  /**
   * Division by zero
   */
  1501: { message: "DivisionByZero" }
};
var CryptoError = {
  /**
   * The merkle proof length is out of bounds.
   */
  1400: { message: "MerkleProofOutOfBounds" },
  /**
   * The index of the leaf is out of bounds.
   */
  1401: { message: "MerkleIndexOutOfBounds" },
  /**
   * No data in hasher state.
   */
  1402: { message: "HasherEmptyState" }
};
var PausableError = {
  /**
   * The operation failed because the contract is paused.
   */
  1e3: { message: "EnforcedPause" },
  /**
   * The operation failed because the contract is not paused.
   */
  1001: { message: "ExpectedPause" }
};
var Client = class extends ContractClient {
  options;
  static async deploy({ signers, policies }, options) {
    return ContractClient.deploy({ signers, policies }, options);
  }
  constructor(options) {
    super(new ContractSpec([
      "AAAAAAAAAYtFeGVjdXRlIGEgZnVuY3Rpb24gb24gYSB0YXJnZXQgY29udHJhY3QuCgpUaGlzIHByb3ZpZGVzIGEgc2VjdXJlIG1lY2hhbmlzbSBmb3IgdGhlIHNtYXJ0IGFjY291bnQgdG8gaW52b2tlCmZ1bmN0aW9ucyBvbiBvdGhlciBjb250cmFjdHMsIHN1Y2ggYXMgdXBkYXRpbmcgcG9saWN5CmNvbmZpZ3VyYXRpb25zLiBSZXF1aXJlcyBzbWFydCBhY2NvdW50IGF1dGhvcml6YXRpb24uCgojIEFyZ3VtZW50cwoKKiBgdGFyZ2V0YCAtIEFkZHJlc3Mgb2YgdGhlIGNvbnRyYWN0IHRvIGludm9rZQoqIGB0YXJnZXRfZm5gIC0gRnVuY3Rpb24gbmFtZSB0byBjYWxsIG9uIHRoZSB0YXJnZXQgY29udHJhY3QKKiBgdGFyZ2V0X2FyZ3NgIC0gQXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIHRhcmdldCBmdW5jdGlvbgAAAAAHZXhlY3V0ZQAAAAADAAAAAAAAAAZ0YXJnZXQAAAAAABMAAAAAAAAACXRhcmdldF9mbgAAAAAAABEAAAAAAAAAC3RhcmdldF9hcmdzAAAAA+oAAAAAAAAAAA==",
      "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAACAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAAAAAACG9wZXJhdG9yAAAAEwAAAAA=",
      "AAAAAAAAAFBBZGQgYSBwb2xpY3kgdG8gYW4gZXhpc3RpbmcgY29udGV4dCBydWxlLgoKUmVxdWlyZXMgc21hcnQgYWNjb3VudCBhdXRob3JpemF0aW9uLgAAAAphZGRfcG9saWN5AAAAAAADAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAAGcG9saWN5AAAAAAATAAAAAAAAAA1pbnN0YWxsX3BhcmFtAAAAAAAAAAAAAAA=",
      "AAAAAAAAAFBBZGQgYSBzaWduZXIgdG8gYW4gZXhpc3RpbmcgY29udGV4dCBydWxlLgoKUmVxdWlyZXMgc21hcnQgYWNjb3VudCBhdXRob3JpemF0aW9uLgAAAAphZGRfc2lnbmVyAAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAAGc2lnbmVyAAAAAAfQAAAABlNpZ25lcgAAAAAAAA==",
      "AAAAAAAAAfdWZXJpZnkgYXV0aG9yaXphdGlvbiBmb3IgdGhlIHNtYXJ0IGFjY291bnQuCgpUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgU29yb2JhbiBob3N0IHdoZW4gYXV0aG9yaXphdGlvbiBpcwpyZXF1aXJlZC4gSXQgdmFsaWRhdGVzIHNpZ25hdHVyZXMgYWdhaW5zdCB0aGUgY29uZmlndXJlZCBjb250ZXh0CnJ1bGVzIGFuZCBwb2xpY2llcy4KCiMgQXJndW1lbnRzCgoqIGBzaWduYXR1cmVfcGF5bG9hZGAgLSBIYXNoIG9mIHRoZSBkYXRhIHRoYXQgd2FzIHNpZ25lZAoqIGBzaWduYXR1cmVzYCAtIE1hcCBvZiBzaWduZXJzIHRvIHRoZWlyIHNpZ25hdHVyZSBkYXRhCiogYGF1dGhfY29udGV4dHNgIC0gQ29udGV4dHMgYmVpbmcgYXV0aG9yaXplZCAoY29udHJhY3QgY2FsbHMsCmRlcGxveW1lbnRzLCBldGMuKQoKIyBSZXR1cm5zCgoqIGBPaygoKSlgIGlmIGF1dGhvcml6YXRpb24gc3VjY2VlZHMKKiBgRXJyKFNtYXJ0QWNjb3VudEVycm9yKWAgaWYgYXV0aG9yaXphdGlvbiBmYWlscwAAAAAMX19jaGVja19hdXRoAAAAAwAAAAAAAAARc2lnbmF0dXJlX3BheWxvYWQAAAAAAAPuAAAAIAAAAAAAAAAKc2lnbmF0dXJlcwAAAAAH0AAAAApTaWduYXR1cmVzAAAAAAAAAAAADWF1dGhfY29udGV4dHMAAAAAAAPqAAAH0AAAAAdDb250ZXh0AAAAAAEAAAPpAAAD7QAAAAAAAAAD",
      "AAAAAAAAAP1DcmVhdGVzIGEgZGVmYXVsdCBjb250ZXh0IHJ1bGUgd2l0aCB0aGUgcHJvdmlkZWQgc2lnbmVycyBhbmQgcG9saWNpZXMuCgojIEFyZ3VtZW50cwoKKiBgc2lnbmVyc2AgLSBWZWN0b3Igb2Ygc2lnbmVycyAoRGVsZWdhdGVkIG9yIEV4dGVybmFsKSB0aGF0IGNhbgphdXRob3JpemUgdHJhbnNhY3Rpb25zCiogYHBvbGljaWVzYCAtIE1hcCBvZiBwb2xpY3kgY29udHJhY3QgYWRkcmVzc2VzIHRvIHRoZWlyIGluc3RhbGxhdGlvbgpwYXJhbWV0ZXJzAAAAAAAADV9fY29uc3RydWN0b3IAAAAAAAACAAAAAAAAAAdzaWduZXJzAAAAA+oAAAfQAAAABlNpZ25lcgAAAAAAAAAAAAhwb2xpY2llcwAAA+wAAAATAAAAAAAAAAA=",
      "AAAAAAAAAFVSZW1vdmUgYSBwb2xpY3kgZnJvbSBhbiBleGlzdGluZyBjb250ZXh0IHJ1bGUuCgpSZXF1aXJlcyBzbWFydCBhY2NvdW50IGF1dGhvcml6YXRpb24uAAAAAAAADXJlbW92ZV9wb2xpY3kAAAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAAGcG9saWN5AAAAAAATAAAAAA==",
      "AAAAAAAAAFVSZW1vdmUgYSBzaWduZXIgZnJvbSBhbiBleGlzdGluZyBjb250ZXh0IHJ1bGUuCgpSZXF1aXJlcyBzbWFydCBhY2NvdW50IGF1dGhvcml6YXRpb24uAAAAAAAADXJlbW92ZV9zaWduZXIAAAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAAGc2lnbmVyAAAAAAfQAAAABlNpZ25lcgAAAAAAAA==",
      "AAAAAAAAAFNBZGQgYSBuZXcgY29udGV4dCBydWxlIHRvIHRoZSBzbWFydCBhY2NvdW50LgoKUmVxdWlyZXMgc21hcnQgYWNjb3VudCBhdXRob3JpemF0aW9uLgAAAAAQYWRkX2NvbnRleHRfcnVsZQAAAAUAAAAAAAAADGNvbnRleHRfdHlwZQAAB9AAAAAPQ29udGV4dFJ1bGVUeXBlAAAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC3ZhbGlkX3VudGlsAAAAA+gAAAAEAAAAAAAAAAdzaWduZXJzAAAAA+oAAAfQAAAABlNpZ25lcgAAAAAAAAAAAAhwb2xpY2llcwAAA+wAAAATAAAAAAAAAAEAAAfQAAAAC0NvbnRleHRSdWxlAA==",
      "AAAAAAAAACtSZXRyaWV2ZSBhIHNwZWNpZmljIGNvbnRleHQgcnVsZSBieSBpdHMgSUQuAAAAABBnZXRfY29udGV4dF9ydWxlAAAAAQAAAAAAAAAPY29udGV4dF9ydWxlX2lkAAAAAAQAAAABAAAH0AAAAAtDb250ZXh0UnVsZQA=",
      "AAAAAAAAAC5SZXRyaWV2ZSBhbGwgY29udGV4dCBydWxlcyBvZiBhIHNwZWNpZmljIHR5cGUuAAAAAAARZ2V0X2NvbnRleHRfcnVsZXMAAAAAAAABAAAAAAAAABFjb250ZXh0X3J1bGVfdHlwZQAAAAAAB9AAAAAPQ29udGV4dFJ1bGVUeXBlAAAAAAEAAAPqAAAH0AAAAAtDb250ZXh0UnVsZQA=",
      "AAAAAAAAAFRSZW1vdmUgYSBjb250ZXh0IHJ1bGUgZnJvbSB0aGUgc21hcnQgYWNjb3VudC4KClJlcXVpcmVzIHNtYXJ0IGFjY291bnQgYXV0aG9yaXphdGlvbi4AAAATcmVtb3ZlX2NvbnRleHRfcnVsZQAAAAABAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAA=",
      "AAAAAAAAAFNVcGRhdGUgdGhlIG5hbWUgb2YgYW4gZXhpc3RpbmcgY29udGV4dCBydWxlLgoKUmVxdWlyZXMgc21hcnQgYWNjb3VudCBhdXRob3JpemF0aW9uLgAAAAAYdXBkYXRlX2NvbnRleHRfcnVsZV9uYW1lAAAAAgAAAAAAAAAPY29udGV4dF9ydWxlX2lkAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAQAAB9AAAAALQ29udGV4dFJ1bGUA",
      "AAAAAAAAAF5VcGRhdGUgdGhlIGV4cGlyYXRpb24gdGltZSBvZiBhbiBleGlzdGluZyBjb250ZXh0IHJ1bGUuCgpSZXF1aXJlcyBzbWFydCBhY2NvdW50IGF1dGhvcml6YXRpb24uAAAAAAAfdXBkYXRlX2NvbnRleHRfcnVsZV92YWxpZF91bnRpbAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAALdmFsaWRfdW50aWwAAAAD6AAAAAQAAAABAAAH0AAAAAtDb250ZXh0UnVsZQA=",
      "AAAABQAAADdFdmVudCBlbWl0dGVkIHdoZW4gYSBwb2xpY3kgaXMgYWRkZWQgdG8gYSBjb250ZXh0IHJ1bGUuAAAAAAAAAAALUG9saWN5QWRkZWQAAAAAAQAAAAxwb2xpY3lfYWRkZWQAAAADAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAEAAAAAAAAABnBvbGljeQAAAAAAEwAAAAAAAAAAAAAADWluc3RhbGxfcGFyYW0AAAAAAAAAAAAAAAAAAAI=",
      "AAAABQAAADdFdmVudCBlbWl0dGVkIHdoZW4gYSBzaWduZXIgaXMgYWRkZWQgdG8gYSBjb250ZXh0IHJ1bGUuAAAAAAAAAAALU2lnbmVyQWRkZWQAAAAAAQAAAAxzaWduZXJfYWRkZWQAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAEAAAAAAAAABnNpZ25lcgAAAAAH0AAAAAZTaWduZXIAAAAAAAAAAAAC",
      "AAAABQAAADtFdmVudCBlbWl0dGVkIHdoZW4gYSBwb2xpY3kgaXMgcmVtb3ZlZCBmcm9tIGEgY29udGV4dCBydWxlLgAAAAAAAAAADVBvbGljeVJlbW92ZWQAAAAAAAABAAAADnBvbGljeV9yZW1vdmVkAAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAEAAAAAAAAABnBvbGljeQAAAAAAEwAAAAAAAAAC",
      "AAAABQAAADtFdmVudCBlbWl0dGVkIHdoZW4gYSBzaWduZXIgaXMgcmVtb3ZlZCBmcm9tIGEgY29udGV4dCBydWxlLgAAAAAAAAAADVNpZ25lclJlbW92ZWQAAAAAAAABAAAADnNpZ25lcl9yZW1vdmVkAAAAAAACAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAEAAAAAAAAABnNpZ25lcgAAAAAH0AAAAAZTaWduZXIAAAAAAAAAAAAC",
      "AAAABQAAACtFdmVudCBlbWl0dGVkIHdoZW4gYSBjb250ZXh0IHJ1bGUgaXMgYWRkZWQuAAAAAAAAAAAQQ29udGV4dFJ1bGVBZGRlZAAAAAEAAAASY29udGV4dF9ydWxlX2FkZGVkAAAAAAAGAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAEAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAAAAAAMY29udGV4dF90eXBlAAAH0AAAAA9Db250ZXh0UnVsZVR5cGUAAAAAAAAAAAAAAAALdmFsaWRfdW50aWwAAAAD6AAAAAQAAAAAAAAAAAAAAAdzaWduZXJzAAAAA+oAAAfQAAAABlNpZ25lcgAAAAAAAAAAAAAAAAAIcG9saWNpZXMAAAPqAAAAEwAAAAAAAAAC",
      "AAAABAAAAClFcnJvciBjb2RlcyBmb3Igc21hcnQgYWNjb3VudCBvcGVyYXRpb25zLgAAAAAAAAAAAAARU21hcnRBY2NvdW50RXJyb3IAAAAAAAANAAAAKlRoZSBzcGVjaWZpZWQgY29udGV4dCBydWxlIGRvZXMgbm90IGV4aXN0LgAAAAAAE0NvbnRleHRSdWxlTm90Rm91bmQAAAALuAAAAChBIGR1cGxpY2F0ZSBjb250ZXh0IHJ1bGUgYWxyZWFkeSBleGlzdHMuAAAAFER1cGxpY2F0ZUNvbnRleHRSdWxlAAALuQAAADpUaGUgcHJvdmlkZWQgY29udGV4dCBjYW5ub3QgYmUgdmFsaWRhdGVkIGFnYWluc3QgYW55IHJ1bGUuAAAAAAASVW52YWxpZGF0ZWRDb250ZXh0AAAAAAu6AAAAJ0V4dGVybmFsIHNpZ25hdHVyZSB2ZXJpZmljYXRpb24gZmFpbGVkLgAAAAAaRXh0ZXJuYWxWZXJpZmljYXRpb25GYWlsZWQAAAAAC7sAAAA1Q29udGV4dCBydWxlIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgc2lnbmVyIG9yIHBvbGljeS4AAAAAAAAUTm9TaWduZXJzQW5kUG9saWNpZXMAAAu8AAAAKVRoZSB2YWxpZF91bnRpbCB0aW1lc3RhbXAgaXMgaW4gdGhlIHBhc3QuAAAAAAAADlBhc3RWYWxpZFVudGlsAAAAAAu9AAAAI1RoZSBzcGVjaWZpZWQgc2lnbmVyIHdhcyBub3QgZm91bmQuAAAAAA5TaWduZXJOb3RGb3VuZAAAAAALvgAAAC5UaGUgc2lnbmVyIGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHJ1bGUuAAAAAAAPRHVwbGljYXRlU2lnbmVyAAAAC78AAAAjVGhlIHNwZWNpZmllZCBwb2xpY3kgd2FzIG5vdCBmb3VuZC4AAAAADlBvbGljeU5vdEZvdW5kAAAAAAvAAAAALlRoZSBwb2xpY3kgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgcnVsZS4AAAAAAA9EdXBsaWNhdGVQb2xpY3kAAAALwQAAACVUb28gbWFueSBzaWduZXJzIGluIHRoZSBjb250ZXh0IHJ1bGUuAAAAAAAADlRvb01hbnlTaWduZXJzAAAAAAvCAAAAJlRvbyBtYW55IHBvbGljaWVzIGluIHRoZSBjb250ZXh0IHJ1bGUuAAAAAAAPVG9vTWFueVBvbGljaWVzAAAAC8MAAAAsVG9vIG1hbnkgY29udGV4dCBydWxlcyBpbiB0aGUgc21hcnQgYWNjb3VudC4AAAATVG9vTWFueUNvbnRleHRSdWxlcwAAAAvE",
      "AAAABQAAAC1FdmVudCBlbWl0dGVkIHdoZW4gYSBjb250ZXh0IHJ1bGUgaXMgcmVtb3ZlZC4AAAAAAAAAAAAAEkNvbnRleHRSdWxlUmVtb3ZlZAAAAAAAAQAAABRjb250ZXh0X3J1bGVfcmVtb3ZlZAAAAAEAAAAAAAAAD2NvbnRleHRfcnVsZV9pZAAAAAAEAAAAAQAAAAI=",
      "AAAABQAAAC1FdmVudCBlbWl0dGVkIHdoZW4gYSBjb250ZXh0IHJ1bGUgaXMgdXBkYXRlZC4AAAAAAAAAAAAAEkNvbnRleHRSdWxlVXBkYXRlZAAAAAAAAQAAABRjb250ZXh0X3J1bGVfdXBkYXRlZAAAAAQAAAAAAAAAD2NvbnRleHRfcnVsZV9pZAAAAAAEAAAAAQAAAAAAAAAEbmFtZQAAABAAAAAAAAAAAAAAAAxjb250ZXh0X3R5cGUAAAfQAAAAD0NvbnRleHRSdWxlVHlwZQAAAAAAAAAAAAAAAAt2YWxpZF91bnRpbAAAAAPoAAAABAAAAAAAAAAC",
      "AAAAAQAAABxNZXRhZGF0YSBmb3IgYSBjb250ZXh0IHJ1bGUuAAAAAAAAAARNZXRhAAAAAwAAAClUaGUgdHlwZSBvZiBjb250ZXh0IHRoaXMgcnVsZSBhcHBsaWVzIHRvLgAAAAAAAAxjb250ZXh0X3R5cGUAAAfQAAAAD0NvbnRleHRSdWxlVHlwZQAAAAApSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNvbnRleHQgcnVsZS4AAAAAAAAEbmFtZQAAABAAAAAxT3B0aW9uYWwgZXhwaXJhdGlvbiBsZWRnZXIgc2VxdWVuY2UgZm9yIHRoZSBydWxlLgAAAAAAAAt2YWxpZF91bnRpbAAAAAPoAAAABA==",
      "AAAAAgAAAEJSZXByZXNlbnRzIGRpZmZlcmVudCB0eXBlcyBvZiBzaWduZXJzIGluIHRoZSBzbWFydCBhY2NvdW50IHN5c3RlbS4AAAAAAAAAAAAGU2lnbmVyAAAAAAACAAAAAQAAAD1BIGRlbGVnYXRlZCBzaWduZXIgdGhhdCB1c2VzIGJ1aWx0LWluIHNpZ25hdHVyZSB2ZXJpZmljYXRpb24uAAAAAAAACURlbGVnYXRlZAAAAAAAAAEAAAATAAAAAQAAAHJBbiBleHRlcm5hbCBzaWduZXIgd2l0aCBjdXN0b20gdmVyaWZpY2F0aW9uIGxvZ2ljLgpDb250YWlucyB0aGUgdmVyaWZpZXIgY29udHJhY3QgYWRkcmVzcyBhbmQgdGhlIHB1YmxpYyBrZXkgZGF0YS4AAAAAAAhFeHRlcm5hbAAAAAIAAAATAAAADg==",
      "AAAAAQAAAD5BIGNvbGxlY3Rpb24gb2Ygc2lnbmF0dXJlcyBtYXBwZWQgdG8gdGhlaXIgcmVzcGVjdGl2ZSBzaWduZXJzLgAAAAAAAAAAAApTaWduYXR1cmVzAAAAAAABAAAAAAAAAAEwAAAAAAAD7AAAB9AAAAAGU2lnbmVyAAAAAAAO",
      "AAAAAQAAADxBIGNvbXBsZXRlIGNvbnRleHQgcnVsZSBkZWZpbmluZyBhdXRob3JpemF0aW9uIHJlcXVpcmVtZW50cy4AAAAAAAAAC0NvbnRleHRSdWxlAAAAAAYAAAApVGhlIHR5cGUgb2YgY29udGV4dCB0aGlzIHJ1bGUgYXBwbGllcyB0by4AAAAAAAAMY29udGV4dF90eXBlAAAH0AAAAA9Db250ZXh0UnVsZVR5cGUAAAAAJ1VuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY29udGV4dCBydWxlLgAAAAACaWQAAAAAAAQAAAApSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNvbnRleHQgcnVsZS4AAAAAAAAEbmFtZQAAABAAAAAwTGlzdCBvZiBwb2xpY3kgY29udHJhY3RzIHRoYXQgbXVzdCBiZSBzYXRpc2ZpZWQuAAAACHBvbGljaWVzAAAD6gAAABMAAAAoTGlzdCBvZiBzaWduZXJzIGF1dGhvcml6ZWQgYnkgdGhpcyBydWxlLgAAAAdzaWduZXJzAAAAA+oAAAfQAAAABlNpZ25lcgAAAAAAMU9wdGlvbmFsIGV4cGlyYXRpb24gbGVkZ2VyIHNlcXVlbmNlIGZvciB0aGUgcnVsZS4AAAAAAAALdmFsaWRfdW50aWwAAAAD6AAAAAQ=",
      "AAAAAgAAAEBUeXBlcyBvZiBjb250ZXh0cyB0aGF0IGNhbiBiZSBhdXRob3JpemVkIGJ5IHNtYXJ0IGFjY291bnQgcnVsZXMuAAAAAAAAAA9Db250ZXh0UnVsZVR5cGUAAAAAAwAAAAAAAAAtRGVmYXVsdCBydWxlcyB0aGF0IGNhbiBhdXRob3JpemUgYW55IGNvbnRleHQuAAAAAAAAB0RlZmF1bHQAAAAAAQAAADBSdWxlcyBzcGVjaWZpYyB0byBjYWxsaW5nIGEgcGFydGljdWxhciBjb250cmFjdC4AAAAMQ2FsbENvbnRyYWN0AAAAAQAAABMAAAABAAAAQlJ1bGVzIHNwZWNpZmljIHRvIGNyZWF0aW5nIGEgY29udHJhY3Qgd2l0aCBhIHBhcnRpY3VsYXIgV0FTTSBoYXNoLgAAAAAADkNyZWF0ZUNvbnRyYWN0AAAAAAABAAAD7gAAACA=",
      "AAAAAgAAACRTdG9yYWdlIGtleXMgZm9yIHNtYXJ0IGFjY291bnQgZGF0YS4AAAAAAAAAFlNtYXJ0QWNjb3VudFN0b3JhZ2VLZXkAAAAAAAcAAAABAAAAUVN0b3JhZ2Uga2V5IGZvciBzaWduZXJzIG9mIGEgY29udGV4dCBydWxlLgpNYXBzIGNvbnRleHQgcnVsZSBJRCB0byBgVmVjPFNpZ25lcj5gLgAAAAAAAAdTaWduZXJzAAAAAAEAAAAEAAAAAQAAAFNTdG9yYWdlIGtleSBmb3IgcG9saWNpZXMgb2YgYSBjb250ZXh0IHJ1bGUuCk1hcHMgY29udGV4dCBydWxlIElEIHRvIGBWZWM8QWRkcmVzcz5gLgAAAAAIUG9saWNpZXMAAAABAAAABAAAAAEAAABbU3RvcmFnZSBrZXkgZm9yIGNvbnRleHQgcnVsZSBJRHMgYnkgdHlwZS4KTWFwcyBgQ29udGV4dFJ1bGVUeXBlYCB0byBgVmVjPHUzMj5gIG9mIHJ1bGUgSURzLgAAAAADSWRzAAAAAAEAAAfQAAAAD0NvbnRleHRSdWxlVHlwZQAAAAABAAAARlN0b3JhZ2Uga2V5IGZvciBjb250ZXh0IHJ1bGUgbWV0YWRhdGEuCk1hcHMgY29udGV4dCBydWxlIElEIHRvIGBNZXRhYC4AAAAAAARNZXRhAAAAAQAAAAQAAAAAAAAAM1N0b3JhZ2Uga2V5IGZvciB0aGUgbmV4dCBhdmFpbGFibGUgY29udGV4dCBydWxlIElELgAAAAAGTmV4dElkAAAAAAABAAAAN1N0b3JhZ2Uga2V5IGRlZmluaW5nIHRoZSBmaW5nZXJwcmludCBlYWNoIGNvbnRleHQgcnVsZS4AAAAAC0ZpbmdlcnByaW50AAAAAAEAAAPuAAAAIAAAAAAAAABbU3RvcmFnZSBrZXkgZm9yIHRoZSBjb3VudCBvZiBhY3RpdmUgY29udGV4dCBydWxlcy4KVXNlZCB0byBlbmZvcmNlIE1BWF9DT05URVhUX1JVTEVTIGxpbWl0LgAAAAAFQ291bnQAAAA=",
      "AAAAAQAAADBJbmRpdmlkdWFsIHNwZW5kaW5nIGVudHJ5IGZvciB0cmFja2luZyBwdXJwb3Nlcy4AAAAAAAAADVNwZW5kaW5nRW50cnkAAAAAAAACAAAAJVRoZSBhbW91bnQgc3BlbnQgaW4gdGhpcyB0cmFuc2FjdGlvbi4AAAAAAAAGYW1vdW50AAAAAAALAAAAM1RoZSBsZWRnZXIgc2VxdWVuY2Ugd2hlbiB0aGlzIHRyYW5zYWN0aW9uIG9jY3VycmVkLgAAAAAPbGVkZ2VyX3NlcXVlbmNlAAAAAAQ=",
      "AAAAAQAAADdJbnRlcm5hbCBzdG9yYWdlIHN0cnVjdHVyZSBmb3Igc3BlbmRpbmcgbGltaXQgdHJhY2tpbmcuAAAAAAAAAAARU3BlbmRpbmdMaW1pdERhdGEAAAAAAAAEAAAAMENhY2hlZCB0b3RhbCBvZiBhbGwgYW1vdW50cyBpbiBzcGVuZGluZ19oaXN0b3J5LgAAABJjYWNoZWRfdG90YWxfc3BlbnQAAAAAAAsAAAA8VGhlIHBlcmlvZCBpbiBsZWRnZXJzIG92ZXIgd2hpY2ggdGhlIHNwZW5kaW5nIGxpbWl0IGFwcGxpZXMuAAAADnBlcmlvZF9sZWRnZXJzAAAAAAAEAAAAPUhpc3Rvcnkgb2Ygc3BlbmRpbmcgdHJhbnNhY3Rpb25zIHdpdGggdGhlaXIgbGVkZ2VyIHNlcXVlbmNlcy4AAAAAAAAQc3BlbmRpbmdfaGlzdG9yeQAAA+oAAAfQAAAADVNwZW5kaW5nRW50cnkAAAAAAAAiVGhlIHNwZW5kaW5nIGxpbWl0IGZvciB0aGUgcGVyaW9kLgAAAAAADnNwZW5kaW5nX2xpbWl0AAAAAAAL",
      "AAAABAAAADFFcnJvciBjb2RlcyBmb3Igc3BlbmRpbmcgbGltaXQgcG9saWN5IG9wZXJhdGlvbnMuAAAAAAAAAAAAABJTcGVuZGluZ0xpbWl0RXJyb3IAAAAAAAUAAABCVGhlIHNtYXJ0IGFjY291bnQgZG9lcyBub3QgaGF2ZSBhIHNwZW5kaW5nIGxpbWl0IHBvbGljeSBpbnN0YWxsZWQuAAAAAAAYU21hcnRBY2NvdW50Tm90SW5zdGFsbGVkAAAMlAAAACVUaGUgc3BlbmRpbmcgbGltaXQgaGFzIGJlZW4gZXhjZWVkZWQuAAAAAAAAFVNwZW5kaW5nTGltaXRFeGNlZWRlZAAAAAAADJUAAAAoVGhlIHNwZW5kaW5nIGxpbWl0IG9yIHBlcmlvZCBpcyBpbnZhbGlkLgAAABRJbnZhbGlkTGltaXRPclBlcmlvZAAADJYAAAAuVGhlIHRyYW5zYWN0aW9uIGlzIG5vdCBhbGxvd2VkIGJ5IHRoaXMgcG9saWN5LgAAAAAACk5vdEFsbG93ZWQAAAAADJcAAAAyVGhlIHNwZW5kaW5nIGhpc3RvcnkgaGFzIHJlYWNoZWQgbWF4aW11bSBjYXBhY2l0eS4AAAAAABdIaXN0b3J5Q2FwYWNpdHlFeGNlZWRlZAAAAAyY",
      "AAAAAgAAACxTdG9yYWdlIGtleXMgZm9yIHNwZW5kaW5nIGxpbWl0IHBvbGljeSBkYXRhLgAAAAAAAAAXU3BlbmRpbmdMaW1pdFN0b3JhZ2VLZXkAAAAAAQAAAAEAAABEU3RvcmFnZSBrZXkgZm9yIHNwZW5kaW5nIGxpbWl0IGRhdGEgb2YgYSBzbWFydCBhY2NvdW50IGNvbnRleHQgcnVsZS4AAAAOQWNjb3VudENvbnRleHQAAAAAAAIAAAATAAAABA==",
      "AAAAAQAAADZJbnN0YWxsYXRpb24gcGFyYW1ldGVycyBmb3IgdGhlIHNwZW5kaW5nIGxpbWl0IHBvbGljeS4AAAAAAAAAAAAaU3BlbmRpbmdMaW1pdEFjY291bnRQYXJhbXMAAAAAAAIAAAA8VGhlIHBlcmlvZCBpbiBsZWRnZXJzIG92ZXIgd2hpY2ggdGhlIHNwZW5kaW5nIGxpbWl0IGFwcGxpZXMuAAAADnBlcmlvZF9sZWRnZXJzAAAAAAAEAAAATlRoZSBtYXhpbXVtIGFtb3VudCB0aGF0IGNhbiBiZSBzcGVudCB3aXRoaW4gdGhlIHNwZWNpZmllZCBwZXJpb2QgKGluCnN0cm9vcHMpLgAAAAAADnNwZW5kaW5nX2xpbWl0AAAAAAAL",
      "AAAABQAAADdFdmVudCBlbWl0dGVkIHdoZW4gYSBzcGVuZGluZyBsaW1pdCBwb2xpY3kgaXMgZW5mb3JjZWQuAAAAAAAAAAAbU3BlbmRpbmdMaW1pdFBvbGljeUVuZm9yY2VkAAAAAAEAAAAec3BlbmRpbmdfbGltaXRfcG9saWN5X2VuZm9yY2VkAAAAAAAFAAAAAAAAAA1zbWFydF9hY2NvdW50AAAAAAAAEwAAAAEAAAAAAAAAB2NvbnRleHQAAAAH0AAAAAdDb250ZXh0AAAAAAAAAAAAAAAAD2NvbnRleHRfcnVsZV9pZAAAAAAEAAAAAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAVdG90YWxfc3BlbnRfaW5fcGVyaW9kAAAAAAAACwAAAAAAAAAC",
      "AAAABAAAADNFcnJvciBjb2RlcyBmb3Igc2ltcGxlIHRocmVzaG9sZCBwb2xpY3kgb3BlcmF0aW9ucy4AAAAAAAAAABRTaW1wbGVUaHJlc2hvbGRFcnJvcgAAAAMAAABEVGhlIHNtYXJ0IGFjY291bnQgZG9lcyBub3QgaGF2ZSBhIHNpbXBsZSB0aHJlc2hvbGQgcG9saWN5IGluc3RhbGxlZC4AAAAYU21hcnRBY2NvdW50Tm90SW5zdGFsbGVkAAAMgAAAAD9XaGVuIHRocmVzaG9sZCBpcyAwIG9yIGV4Y2VlZHMgdGhlIG51bWJlciBvZiBhdmFpbGFibGUgc2lnbmVycy4AAAAAEEludmFsaWRUaHJlc2hvbGQAAAyBAAAALlRoZSB0cmFuc2FjdGlvbiBpcyBub3QgYWxsb3dlZCBieSB0aGlzIHBvbGljeS4AAAAAAApOb3RBbGxvd2VkAAAAAAyC",
      "AAAABQAAADlFdmVudCBlbWl0dGVkIHdoZW4gYSBzaW1wbGUgdGhyZXNob2xkIHBvbGljeSBpcyBlbmZvcmNlZC4AAAAAAAAAAAAAFFNpbXBsZVBvbGljeUVuZm9yY2VkAAAAAQAAABZzaW1wbGVfcG9saWN5X2VuZm9yY2VkAAAAAAAEAAAAAAAAAA1zbWFydF9hY2NvdW50AAAAAAAAEwAAAAEAAAAAAAAAB2NvbnRleHQAAAAH0AAAAAdDb250ZXh0AAAAAAAAAAAAAAAAD2NvbnRleHRfcnVsZV9pZAAAAAAEAAAAAAAAAAAAAAAVYXV0aGVudGljYXRlZF9zaWduZXJzAAAAAAAD6gAAB9AAAAAGU2lnbmVyAAAAAAAAAAAAAg==",
      "AAAAAgAAAC5TdG9yYWdlIGtleXMgZm9yIHNpbXBsZSB0aHJlc2hvbGQgcG9saWN5IGRhdGEuAAAAAAAAAAAAGVNpbXBsZVRocmVzaG9sZFN0b3JhZ2VLZXkAAAAAAAABAAAAAQAAAAAAAAAOQWNjb3VudENvbnRleHQAAAAAAAIAAAATAAAABA==",
      "AAAAAQAAADhJbnN0YWxsYXRpb24gcGFyYW1ldGVycyBmb3IgdGhlIHNpbXBsZSB0aHJlc2hvbGQgcG9saWN5LgAAAAAAAAAcU2ltcGxlVGhyZXNob2xkQWNjb3VudFBhcmFtcwAAAAEAAAA5VGhlIG1pbmltdW0gbnVtYmVyIG9mIHNpZ25lcnMgcmVxdWlyZWQgZm9yIGF1dGhvcml6YXRpb24uAAAAAAAACXRocmVzaG9sZAAAAAAAAAQ=",
      "AAAABAAAADVFcnJvciBjb2RlcyBmb3Igd2VpZ2h0ZWQgdGhyZXNob2xkIHBvbGljeSBvcGVyYXRpb25zLgAAAAAAAAAAAAAWV2VpZ2h0ZWRUaHJlc2hvbGRFcnJvcgAAAAAABAAAAEZUaGUgc21hcnQgYWNjb3VudCBkb2VzIG5vdCBoYXZlIGEgd2VpZ2h0ZWQgdGhyZXNob2xkIHBvbGljeSBpbnN0YWxsZWQuAAAAAAAYU21hcnRBY2NvdW50Tm90SW5zdGFsbGVkAAAMigAAAB9UaGUgdGhyZXNob2xkIHZhbHVlIGlzIGludmFsaWQuAAAAABBJbnZhbGlkVGhyZXNob2xkAAAMiwAAAChBIG1hdGhlbWF0aWNhbCBvcGVyYXRpb24gd291bGQgb3ZlcmZsb3cuAAAADE1hdGhPdmVyZmxvdwAADIwAAAAuVGhlIHRyYW5zYWN0aW9uIGlzIG5vdCBhbGxvd2VkIGJ5IHRoaXMgcG9saWN5LgAAAAAACk5vdEFsbG93ZWQAAAAADI0=",
      "AAAABQAAADtFdmVudCBlbWl0dGVkIHdoZW4gYSB3ZWlnaHRlZCB0aHJlc2hvbGQgcG9saWN5IGlzIGVuZm9yY2VkLgAAAAAAAAAAFldlaWdodGVkUG9saWN5RW5mb3JjZWQAAAAAAAEAAAAYd2VpZ2h0ZWRfcG9saWN5X2VuZm9yY2VkAAAABAAAAAAAAAANc21hcnRfYWNjb3VudAAAAAAAABMAAAABAAAAAAAAAAdjb250ZXh0AAAAB9AAAAAHQ29udGV4dAAAAAAAAAAAAAAAAA9jb250ZXh0X3J1bGVfaWQAAAAABAAAAAAAAAAAAAAAFWF1dGhlbnRpY2F0ZWRfc2lnbmVycwAAAAAAA+oAAAfQAAAABlNpZ25lcgAAAAAAAAAAAAI=",
      "AAAAAgAAADBTdG9yYWdlIGtleXMgZm9yIHdlaWdodGVkIHRocmVzaG9sZCBwb2xpY3kgZGF0YS4AAAAAAAAAG1dlaWdodGVkVGhyZXNob2xkU3RvcmFnZUtleQAAAAABAAAAAQAAAKtTdG9yYWdlIGtleSBmb3IgdGhlIHRocmVzaG9sZCB2YWx1ZSBhbmQgc2lnbmVyIHdlaWdodHMgb2YgYSBzbWFydAphY2NvdW50IGNvbnRleHQgcnVsZS4gTWFwcyB0byBhIGBXZWlnaHRlZFRocmVzaG9sZEFjY291bnRQYXJhbXNgCmNvbnRhaW5pbmcgdGhyZXNob2xkIGFuZCBzaWduZXIgd2VpZ2h0cy4AAAAADkFjY291bnRDb250ZXh0AAAAAAACAAAAEwAAAAQ=",
      "AAAAAQAAADpJbnN0YWxsYXRpb24gcGFyYW1ldGVycyBmb3IgdGhlIHdlaWdodGVkIHRocmVzaG9sZCBwb2xpY3kuAAAAAAAAAAAAHldlaWdodGVkVGhyZXNob2xkQWNjb3VudFBhcmFtcwAAAAAAAgAAAC9NYXBwaW5nIG9mIHNpZ25lcnMgdG8gdGhlaXIgcmVzcGVjdGl2ZSB3ZWlnaHRzLgAAAAAOc2lnbmVyX3dlaWdodHMAAAAAA+wAAAfQAAAABlNpZ25lcgAAAAAABAAAADRUaGUgbWluaW11bSB0b3RhbCB3ZWlnaHQgcmVxdWlyZWQgZm9yIGF1dGhvcml6YXRpb24uAAAACXRocmVzaG9sZAAAAAAAAAQ=",
      "AAAABAAAADFFcnJvciB0eXBlcyBmb3IgV2ViQXV0aG4gdmVyaWZpY2F0aW9uIG9wZXJhdGlvbnMuAAAAAAAAAAAAAA1XZWJBdXRobkVycm9yAAAAAAAACQAAADlUaGUgc2lnbmF0dXJlIHBheWxvYWQgaXMgaW52YWxpZCBvciBoYXMgaW5jb3JyZWN0IGZvcm1hdC4AAAAAAAAXU2lnbmF0dXJlUGF5bG9hZEludmFsaWQAAAAMJgAAADNUaGUgY2xpZW50IGRhdGEgZXhjZWVkcyB0aGUgbWF4aW11bSBhbGxvd2VkIGxlbmd0aC4AAAAAEUNsaWVudERhdGFUb29Mb25nAAAAAAAMJwAAACZGYWlsZWQgdG8gcGFyc2UgSlNPTiBmcm9tIGNsaWVudCBkYXRhLgAAAAAADkpzb25QYXJzZUVycm9yAAAAAAwoAAAANFRoZSB0eXBlIGZpZWxkIGluIGNsaWVudCBkYXRhIGlzIG5vdCAid2ViYXV0aG4uZ2V0Ii4AAAAQVHlwZUZpZWxkSW52YWxpZAAADCkAAAA7VGhlIGNoYWxsZW5nZSBpbiBjbGllbnQgZGF0YSBkb2VzIG5vdCBtYXRjaCBleHBlY3RlZCB2YWx1ZS4AAAAAEENoYWxsZW5nZUludmFsaWQAAAwqAAAANlRoZSBhdXRoZW50aWNhdG9yIGRhdGEgZm9ybWF0IGlzIGludmFsaWQgb3IgdG9vIHNob3J0LgAAAAAAFUF1dGhEYXRhRm9ybWF0SW52YWxpZAAAAAAADCsAAAA8VGhlIFVzZXIgUHJlc2VudCAoVVApIGJpdCBpcyBub3Qgc2V0IGluIGF1dGhlbnRpY2F0b3IgZmxhZ3MuAAAAEFByZXNlbnRCaXROb3RTZXQAAAwsAAAAPVRoZSBVc2VyIFZlcmlmaWVkIChVVikgYml0IGlzIG5vdCBzZXQgaW4gYXV0aGVudGljYXRvciBmbGFncy4AAAAAAAARVmVyaWZpZWRCaXROb3RTZXQAAAAAAAwtAAAAP0ludmFsaWQgcmVsYXRpb25zaGlwIGJldHdlZW4gQmFja3VwIEVsaWdpYmlsaXR5IGFuZCBTdGF0ZSBiaXRzLgAAAAAfQmFja3VwRWxpZ2liaWxpdHlBbmRTdGF0ZU5vdFNldAAAAAwu",
      "AAAAAQAAAMhXZWJBdXRobiBzaWduYXR1cmUgZGF0YSBzdHJ1Y3R1cmUgY29udGFpbmluZyBhbGwgY29tcG9uZW50cyBuZWVkZWQgZm9yCnZlcmlmaWNhdGlvbi4KClRoaXMgc3RydWN0dXJlIGVuY2Fwc3VsYXRlcyB0aGUgc2lnbmF0dXJlIGFuZCBhc3NvY2lhdGVkIGRhdGEgZ2VuZXJhdGVkCmR1cmluZyBhIFdlYkF1dGhuIGF1dGhlbnRpY2F0aW9uIGNlcmVtb255LgAAAAAAAAAPV2ViQXV0aG5TaWdEYXRhAAAAAAMAAAAyUmF3IGF1dGhlbnRpY2F0b3IgZGF0YSBmcm9tIHRoZSBXZWJBdXRobiByZXNwb25zZS4AAAAAABJhdXRoZW50aWNhdG9yX2RhdGEAAAAAAA4AAAAwUmF3IGNsaWVudCBkYXRhIEpTT04gZnJvbSB0aGUgV2ViQXV0aG4gcmVzcG9uc2UuAAAAC2NsaWVudF9kYXRhAAAAAA4AAAA1VGhlIGNyeXB0b2dyYXBoaWMgc2lnbmF0dXJlICg2NCBieXRlcyBmb3Igc2VjcDI1NnIxKS4AAAAAAAAJc2lnbmF0dXJlAAAAAAAD7gAAAEA=",
      "AAAABAAAAAAAAAAAAAAAEFVwZ3JhZGVhYmxlRXJyb3IAAAABAAAAQVdoZW4gbWlncmF0aW9uIGlzIGF0dGVtcHRlZCBidXQgbm90IGFsbG93ZWQgZHVlIHRvIHVwZ3JhZGUgc3RhdGUuAAAAAAAAE01pZ3JhdGlvbk5vdEFsbG93ZWQAAAAETA==",
      "AAAABQAAACpFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG1lcmtsZSByb290IGlzIHNldC4AAAAAAAAAAAAHU2V0Um9vdAAAAAABAAAACHNldF9yb290AAAAAQAAAAAAAAAEcm9vdAAAAA4AAAAAAAAAAg==",
      "AAAABQAAACdFdmVudCBlbWl0dGVkIHdoZW4gYW4gaW5kZXggaXMgY2xhaW1lZC4AAAAAAAAAAApTZXRDbGFpbWVkAAAAAAABAAAAC3NldF9jbGFpbWVkAAAAAAEAAAAAAAAABWluZGV4AAAAAAAAAAAAAAAAAAAC",
      "AAAABAAAAAAAAAAAAAAAFk1lcmtsZURpc3RyaWJ1dG9yRXJyb3IAAAAAAAMAAAAbVGhlIG1lcmtsZSByb290IGlzIG5vdCBzZXQuAAAAAApSb290Tm90U2V0AAAAAAUUAAAAJ1RoZSBwcm92aWRlZCBpbmRleCB3YXMgYWxyZWFkeSBjbGFpbWVkLgAAAAATSW5kZXhBbHJlYWR5Q2xhaW1lZAAAAAUVAAAAFVRoZSBwcm9vZiBpcyBpbnZhbGlkLgAAAAAAAAxJbnZhbGlkUHJvb2YAAAUW",
      "AAAAAgAAAD1TdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgTWVya2xlRGlzdHJpYnV0b3JgAAAAAAAAAAAAABtNZXJrbGVEaXN0cmlidXRvclN0b3JhZ2VLZXkAAAAAAgAAAAAAAAAoVGhlIE1lcmtsZSByb290IG9mIHRoZSBkaXN0cmlidXRpb24gdHJlZQAAAARSb290AAAAAQAAACNNYXBzIGFuIGluZGV4IHRvIGl0cyBjbGFpbWVkIHN0YXR1cwAAAAAHQ2xhaW1lZAAAAAABAAAABA==",
      "AAAAAgAAACpSb3VuZGluZyBkaXJlY3Rpb24gZm9yIGRpdmlzaW9uIG9wZXJhdGlvbnMAAAAAAAAAAAAIUm91bmRpbmcAAAACAAAAAAAAACVSb3VuZCB0b3dhcmQgbmVnYXRpdmUgaW5maW5pdHkgKGRvd24pAAAAAAAABUZsb29yAAAAAAAAAAAAACNSb3VuZCB0b3dhcmQgcG9zaXRpdmUgaW5maW5pdHkgKHVwKQAAAAAEQ2VpbA==",
      "AAAABAAAAAAAAAAAAAAAFlNvcm9iYW5GaXhlZFBvaW50RXJyb3IAAAAAAAIAAAAcQXJpdGhtZXRpYyBvdmVyZmxvdyBvY2N1cnJlZAAAAAhPdmVyZmxvdwAABdwAAAAQRGl2aXNpb24gYnkgemVybwAAAA5EaXZpc2lvbkJ5WmVybwAAAAAF3Q==",
      "AAAABAAAAAAAAAAAAAAAC0NyeXB0b0Vycm9yAAAAAAMAAAApVGhlIG1lcmtsZSBwcm9vZiBsZW5ndGggaXMgb3V0IG9mIGJvdW5kcy4AAAAAAAAWTWVya2xlUHJvb2ZPdXRPZkJvdW5kcwAAAAAFeAAAACdUaGUgaW5kZXggb2YgdGhlIGxlYWYgaXMgb3V0IG9mIGJvdW5kcy4AAAAAFk1lcmtsZUluZGV4T3V0T2ZCb3VuZHMAAAAABXkAAAAYTm8gZGF0YSBpbiBoYXNoZXIgc3RhdGUuAAAAEEhhc2hlckVtcHR5U3RhdGUAAAV6",
      "AAAABQAAACpFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGNvbnRyYWN0IGlzIHBhdXNlZC4AAAAAAAAAAAAGUGF1c2VkAAAAAAABAAAABnBhdXNlZAAAAAAAAAAAAAI=",
      "AAAABQAAACxFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGNvbnRyYWN0IGlzIHVucGF1c2VkLgAAAAAAAAAIVW5wYXVzZWQAAAABAAAACHVucGF1c2VkAAAAAAAAAAI=",
      "AAAABAAAAAAAAAAAAAAADVBhdXNhYmxlRXJyb3IAAAAAAAACAAAANFRoZSBvcGVyYXRpb24gZmFpbGVkIGJlY2F1c2UgdGhlIGNvbnRyYWN0IGlzIHBhdXNlZC4AAAANRW5mb3JjZWRQYXVzZQAAAAAAA+gAAAA4VGhlIG9wZXJhdGlvbiBmYWlsZWQgYmVjYXVzZSB0aGUgY29udHJhY3QgaXMgbm90IHBhdXNlZC4AAAANRXhwZWN0ZWRQYXVzZQAAAAAAA+k=",
      "AAAAAgAAACJTdG9yYWdlIGtleSBmb3IgdGhlIHBhdXNhYmxlIHN0YXRlAAAAAAAAAAAAElBhdXNhYmxlU3RvcmFnZUtleQAAAAAAAQAAAAAAAAAySW5kaWNhdGVzIHdoZXRoZXIgdGhlIGNvbnRyYWN0IGlzIGluIHBhdXNlZCBzdGF0ZS4AAAAAAAZQYXVzZWQAAA=="
    ]), options);
    this.options = options;
  }
  fromJSON = {
    execute: this.txFromJSON,
    upgrade: this.txFromJSON,
    add_policy: this.txFromJSON,
    add_signer: this.txFromJSON,
    remove_policy: this.txFromJSON,
    remove_signer: this.txFromJSON,
    add_context_rule: this.txFromJSON,
    get_context_rule: this.txFromJSON,
    get_context_rules: this.txFromJSON,
    remove_context_rule: this.txFromJSON,
    update_context_rule_name: this.txFromJSON,
    update_context_rule_valid_until: this.txFromJSON
  };
};

// node_modules/smart-account-kit/dist/constants.js
var WEBAUTHN_TIMEOUT_MS = 6e4;
var BASE_FEE = "100";
var STROOPS_PER_XLM = 1e7;
var FRIENDBOT_RESERVE_XLM = 5;
var SECP256R1_PUBLIC_KEY_SIZE = 65;
var UNCOMPRESSED_PUBKEY_PREFIX = 4;
var DEFAULT_SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1e3;
var LEDGERS_PER_HOUR = 720;
var AUTH_ENTRY_EXPIRATION_BUFFER = 100;
var FRIENDBOT_URL = "https://friendbot.stellar.org";
var DEFAULT_INDEXER_TIMEOUT_MS = 1e4;
var DEFAULT_RELAYER_TIMEOUT_MS = 36e4;
var API_PATH_LOOKUP = "/api/lookup";
var API_PATH_LOOKUP_ADDRESS = "/api/lookup/address";
var API_PATH_CONTRACT = "/api/contract";
var API_PATH_STATS = "/api/stats";

// node_modules/smart-account-kit/dist/utils.js
var import_base64url = __toESM(require_base64url2(), 1);
import { StrKey, hash, xdr, Address } from "@stellar/stellar-sdk";

// node_modules/smart-account-kit/dist/errors.js
var SmartAccountErrorCode;
(function(SmartAccountErrorCode2) {
  SmartAccountErrorCode2[SmartAccountErrorCode2["INVALID_CONFIG"] = 1001] = "INVALID_CONFIG";
  SmartAccountErrorCode2[SmartAccountErrorCode2["MISSING_CONFIG"] = 1002] = "MISSING_CONFIG";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WALLET_NOT_CONNECTED"] = 2001] = "WALLET_NOT_CONNECTED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WALLET_ALREADY_EXISTS"] = 2002] = "WALLET_ALREADY_EXISTS";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WALLET_NOT_FOUND"] = 2003] = "WALLET_NOT_FOUND";
  SmartAccountErrorCode2[SmartAccountErrorCode2["CREDENTIAL_NOT_FOUND"] = 3001] = "CREDENTIAL_NOT_FOUND";
  SmartAccountErrorCode2[SmartAccountErrorCode2["CREDENTIAL_ALREADY_EXISTS"] = 3002] = "CREDENTIAL_ALREADY_EXISTS";
  SmartAccountErrorCode2[SmartAccountErrorCode2["CREDENTIAL_INVALID"] = 3003] = "CREDENTIAL_INVALID";
  SmartAccountErrorCode2[SmartAccountErrorCode2["CREDENTIAL_DEPLOYMENT_FAILED"] = 3004] = "CREDENTIAL_DEPLOYMENT_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WEBAUTHN_REGISTRATION_FAILED"] = 4001] = "WEBAUTHN_REGISTRATION_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WEBAUTHN_AUTHENTICATION_FAILED"] = 4002] = "WEBAUTHN_AUTHENTICATION_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WEBAUTHN_NOT_SUPPORTED"] = 4003] = "WEBAUTHN_NOT_SUPPORTED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["WEBAUTHN_CANCELLED"] = 4004] = "WEBAUTHN_CANCELLED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["TRANSACTION_SIMULATION_FAILED"] = 5001] = "TRANSACTION_SIMULATION_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["TRANSACTION_SIGNING_FAILED"] = 5002] = "TRANSACTION_SIGNING_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["TRANSACTION_SUBMISSION_FAILED"] = 5003] = "TRANSACTION_SUBMISSION_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["TRANSACTION_TIMEOUT"] = 5004] = "TRANSACTION_TIMEOUT";
  SmartAccountErrorCode2[SmartAccountErrorCode2["SIGNER_NOT_FOUND"] = 6001] = "SIGNER_NOT_FOUND";
  SmartAccountErrorCode2[SmartAccountErrorCode2["SIGNER_INVALID"] = 6002] = "SIGNER_INVALID";
  SmartAccountErrorCode2[SmartAccountErrorCode2["INVALID_ADDRESS"] = 7001] = "INVALID_ADDRESS";
  SmartAccountErrorCode2[SmartAccountErrorCode2["INVALID_AMOUNT"] = 7002] = "INVALID_AMOUNT";
  SmartAccountErrorCode2[SmartAccountErrorCode2["INVALID_INPUT"] = 7003] = "INVALID_INPUT";
  SmartAccountErrorCode2[SmartAccountErrorCode2["STORAGE_READ_FAILED"] = 8001] = "STORAGE_READ_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["STORAGE_WRITE_FAILED"] = 8002] = "STORAGE_WRITE_FAILED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["SESSION_EXPIRED"] = 9001] = "SESSION_EXPIRED";
  SmartAccountErrorCode2[SmartAccountErrorCode2["SESSION_INVALID"] = 9002] = "SESSION_INVALID";
})(SmartAccountErrorCode || (SmartAccountErrorCode = {}));
var SmartAccountError2 = class _SmartAccountError extends Error {
  /** Error code for programmatic error handling */
  code;
  /** Additional context about the error */
  context;
  /** Original error that caused this error */
  cause;
  constructor(message, code, options) {
    super(message);
    this.name = "SmartAccountError";
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _SmartAccountError);
    }
  }
  /**
   * Create a formatted error message with code and context.
   */
  toDetailedString() {
    let msg = `[${this.code}] ${this.message}`;
    if (this.context) {
      msg += `
Context: ${JSON.stringify(this.context, null, 2)}`;
    }
    if (this.cause) {
      msg += `
Caused by: ${this.cause.message}`;
    }
    return msg;
  }
};
var ValidationError = class extends SmartAccountError2 {
  constructor(message, code = SmartAccountErrorCode.INVALID_INPUT, context) {
    super(message, code, { context });
    this.name = "ValidationError";
  }
};

// node_modules/smart-account-kit/dist/utils.js
function validateAddress(address, fieldName = "address") {
  if (!address || typeof address !== "string") {
    throw new ValidationError(`${fieldName} is required`, SmartAccountErrorCode.INVALID_ADDRESS, { field: fieldName });
  }
  const isValidAccount = StrKey.isValidEd25519PublicKey(address);
  const isValidContract = StrKey.isValidContract(address);
  if (!isValidAccount && !isValidContract) {
    throw new ValidationError(`Invalid ${fieldName}: must be a valid Stellar account (G...) or contract (C...) address`, SmartAccountErrorCode.INVALID_ADDRESS, { field: fieldName, value: address.slice(0, 10) + "..." });
  }
}
function validateAmount(amount, fieldName = "amount") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new ValidationError(`${fieldName} must be a number`, SmartAccountErrorCode.INVALID_AMOUNT, { field: fieldName });
  }
  if (amount <= 0) {
    throw new ValidationError(`${fieldName} must be positive`, SmartAccountErrorCode.INVALID_AMOUNT, { field: fieldName, value: amount });
  }
}
function xlmToStroops(xlm) {
  return BigInt(Math.round(xlm * STROOPS_PER_XLM));
}
function stroopsToXlm(stroops) {
  return Number(stroops) / STROOPS_PER_XLM;
}
function buildKeyData(publicKey, credentialId) {
  const credentialIdBuffer = typeof credentialId === "string" ? import_base64url.default.toBuffer(credentialId) : credentialId;
  return Buffer.concat([Buffer.from(publicKey), credentialIdBuffer]);
}
function deriveContractAddress(credentialId, deployerPublicKey, networkPassphrase) {
  const preimage = xdr.HashIdPreimage.envelopeTypeContractId(new xdr.HashIdPreimageContractId({
    networkId: hash(Buffer.from(networkPassphrase)),
    contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(new xdr.ContractIdPreimageFromAddress({
      address: Address.fromString(deployerPublicKey).toScAddress(),
      salt: hash(credentialId)
    }))
  }));
  return StrKey.encodeContract(hash(preimage.toXDR()));
}
async function extractPublicKeyFromAttestation(response) {
  let publicKey;
  if (response.publicKey) {
    publicKey = import_base64url.default.toBuffer(response.publicKey);
    publicKey = publicKey.slice(publicKey.length - SECP256R1_PUBLIC_KEY_SIZE);
  }
  if (!publicKey || publicKey[0] !== UNCOMPRESSED_PUBKEY_PREFIX || publicKey.length !== SECP256R1_PUBLIC_KEY_SIZE) {
    let x;
    let y;
    if (response.authenticatorData) {
      const authenticatorData = import_base64url.default.toBuffer(response.authenticatorData);
      const credentialIdLength = authenticatorData[53] << 8 | authenticatorData[54];
      x = authenticatorData.slice(65 + credentialIdLength, 97 + credentialIdLength);
      y = authenticatorData.slice(100 + credentialIdLength, 132 + credentialIdLength);
    } else if (response.attestationObject) {
      const attestationObject = import_base64url.default.toBuffer(response.attestationObject);
      const publicKeyPrefixSlice = Buffer.from([
        165,
        1,
        2,
        3,
        38,
        32,
        1,
        33,
        88,
        32
      ]);
      let startIndex = attestationObject.indexOf(publicKeyPrefixSlice);
      startIndex = startIndex + publicKeyPrefixSlice.length;
      x = attestationObject.slice(startIndex, 32 + startIndex);
      y = attestationObject.slice(35 + startIndex, 67 + startIndex);
    } else {
      throw new Error("Could not extract public key from attestation response");
    }
    publicKey = Buffer.from([
      UNCOMPRESSED_PUBKEY_PREFIX,
      // 0x04 - Uncompressed EC point prefix
      ...x,
      ...y
    ]);
  }
  return new Uint8Array(publicKey);
}
function compactSignature(derSignature) {
  let offset = 2;
  const rLength = derSignature[offset + 1];
  const r = derSignature.slice(offset + 2, offset + 2 + rLength);
  offset += 2 + rLength;
  const sLength = derSignature[offset + 1];
  const s = derSignature.slice(offset + 2, offset + 2 + sLength);
  const rBigInt = BigInt("0x" + r.toString("hex"));
  let sBigInt = BigInt("0x" + s.toString("hex"));
  const n = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
  const halfN = n / 2n;
  if (sBigInt > halfN) {
    sBigInt = n - sBigInt;
  }
  const rPadded = Buffer.from(rBigInt.toString(16).padStart(64, "0"), "hex");
  const sLowS = Buffer.from(sBigInt.toString(16).padStart(64, "0"), "hex");
  return new Uint8Array(Buffer.concat([rPadded, sLowS]));
}
function generateChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return import_base64url.default.encode(Buffer.from(bytes));
}

// node_modules/smart-account-kit/dist/events.js
var SmartAccountEventEmitter = class {
  listeners = /* @__PURE__ */ new Map();
  /** Optional error handler for listener errors */
  errorHandler;
  /**
   * Set an error handler for listener errors.
   * By default, listener errors are silently caught.
   *
   * @param handler - Error handler function, or undefined to disable
   */
  setErrorHandler(handler) {
    this.errorHandler = handler;
  }
  /**
   * Subscribe to an event.
   *
   * @param event - The event to subscribe to
   * @param listener - The callback function
   * @returns An unsubscribe function
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    const listeners = this.listeners.get(event);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  /**
   * Subscribe to an event, but only trigger once.
   *
   * @param event - The event to subscribe to
   * @param listener - The callback function
   * @returns An unsubscribe function
   */
  once(event, listener) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      listener(data);
    });
    return unsubscribe;
  }
  /**
   * Unsubscribe from an event.
   *
   * @param event - The event to unsubscribe from
   * @param listener - The callback function to remove
   */
  off(event, listener) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  /**
   * Emit an event to all subscribers.
   *
   * Listener errors are caught to prevent one failing listener from
   * affecting others. If you need error handling, wrap your listener.
   *
   * @param event - The event to emit
   * @param data - The event data
   */
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (err) {
          if (this.errorHandler) {
            this.errorHandler(event, err);
          }
        }
      }
    }
  }
  /**
   * Remove all listeners for a specific event, or all events if no event is specified.
   *
   * @param event - Optional event to clear listeners for
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  /**
   * Get the number of listeners for an event.
   *
   * @param event - The event to check
   * @returns The number of listeners
   */
  listenerCount(event) {
    return this.listeners.get(event)?.size ?? 0;
  }
};

// node_modules/smart-account-kit/dist/external-signers.js
import { Keypair, hash as hash2, xdr as xdr2 } from "@stellar/stellar-sdk";
var WALLET_STORAGE_KEY = "external_wallets";
var ExternalSignerManager = class {
  /** Keypair-based signers (memory-only, never persisted) */
  keypairSigners = /* @__PURE__ */ new Map();
  /** External wallet adapter (optional, for SWK integration) */
  walletAdapter = null;
  /** Network passphrase for signing */
  networkPassphrase;
  /** Storage for persisting wallet connections (optional) */
  storage = null;
  /** Whether connections have been restored */
  restored = false;
  constructor(networkPassphrase, walletAdapter, storage) {
    this.networkPassphrase = networkPassphrase;
    this.walletAdapter = walletAdapter ?? null;
    this.storage = storage ?? null;
  }
  /**
   * Set or update the external wallet adapter
   */
  setWalletAdapter(adapter) {
    this.walletAdapter = adapter;
  }
  /**
   * Add a signer from a raw secret key.
   *
   * The keypair is stored in memory only and is never persisted.
   * It will be lost when the page is refreshed.
   *
   * @param secretKey - Stellar secret key (S...)
   * @returns The derived public address
   * @throws Error if the secret key is invalid
   *
   * @example
   * ```typescript
   * const { address } = kit.externalSigners.addFromSecret("SCZANGBA5YHTNYVVV3C7CAZMTQDBJHJG6C34REYB6WBMG7CKKFJHYAEGQ");
   * console.log(`Added signer: ${address}`);
   * ```
   */
  addFromSecret(secretKey) {
    let keypair;
    try {
      keypair = Keypair.fromSecret(secretKey);
    } catch {
      throw new Error("Invalid secret key. Must be a valid Stellar secret key (S...)");
    }
    const address = keypair.publicKey();
    this.keypairSigners.set(address, { keypair, address });
    return { address };
  }
  /**
   * Add a signer from an external wallet (Freighter, Lobstr, etc.)
   *
   * Requires StellarWalletsKit to be installed and the adapter to be initialized.
   * Shows the wallet selection modal and tracks the connected wallet.
   * If storage is configured, the connection is persisted for auto-restore.
   *
   * @returns Connected wallet info, or null if cancelled/unavailable
   * @throws Error if no wallet adapter is configured
   *
   * @example
   * ```typescript
   * const wallet = await kit.externalSigners.addFromWallet();
   * if (wallet) {
   *   console.log(`Connected: ${wallet.walletName} (${wallet.address})`);
   * }
   * ```
   */
  async addFromWallet() {
    if (!this.walletAdapter) {
      throw new Error("No wallet adapter configured. Install @creit-tech/stellar-wallets-kit and pass a StellarWalletsKitAdapter to the SDK config.");
    }
    const wallet = await this.walletAdapter.connect();
    if (wallet && this.storage) {
      this.saveWalletToStorage(wallet);
    }
    return wallet;
  }
  /**
   * Restore previously connected wallets from storage.
   *
   * Attempts to reconnect to all wallets that were saved in storage.
   * This is called automatically if storage is configured, but can also
   * be called manually.
   *
   * @returns Array of successfully restored wallet connections
   *
   * @example
   * ```typescript
   * const restored = await kit.externalSigners.restoreConnections();
   * console.log(`Restored ${restored.length} wallet connections`);
   * ```
   */
  async restoreConnections() {
    if (this.restored) {
      return this.walletAdapter?.getConnectedWallets() ?? [];
    }
    this.restored = true;
    if (!this.storage || !this.walletAdapter?.reconnect) {
      return [];
    }
    const stored = this.getStoredWallets();
    const restored = [];
    for (const savedWallet of stored) {
      try {
        const wallet = await this.walletAdapter.reconnect(savedWallet.walletId);
        if (wallet) {
          restored.push(wallet);
        } else {
          this.removeWalletFromStorage(savedWallet.address);
        }
      } catch {
        this.removeWalletFromStorage(savedWallet.address);
      }
    }
    return restored;
  }
  /**
   * Remove a signer by address.
   *
   * For keypair signers, this removes the keypair from memory.
   * For wallet signers, this disconnects the wallet and removes from storage.
   *
   * @param address - The G-address to remove
   */
  remove(address) {
    this.keypairSigners.delete(address);
    const adapter = this.walletAdapter;
    if (adapter?.disconnectByAddress) {
      adapter.disconnectByAddress(address);
    }
    this.removeWalletFromStorage(address);
  }
  // ===========================================================================
  // Private Storage Helpers
  // ===========================================================================
  /**
   * Get stored wallet connections from storage
   */
  getStoredWallets() {
    if (!this.storage)
      return [];
    try {
      const data = this.storage.getItem(WALLET_STORAGE_KEY);
      if (!data)
        return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  /**
   * Save a wallet connection to storage
   */
  saveWalletToStorage(wallet) {
    if (!this.storage)
      return;
    const stored = this.getStoredWallets();
    const filtered = stored.filter((w) => w.address !== wallet.address);
    filtered.push({
      address: wallet.address,
      walletId: wallet.walletId,
      walletName: wallet.walletName,
      connectedAt: Date.now()
    });
    this.storage.setItem(WALLET_STORAGE_KEY, JSON.stringify(filtered));
  }
  /**
   * Remove a wallet connection from storage
   */
  removeWalletFromStorage(address) {
    if (!this.storage)
      return;
    const stored = this.getStoredWallets();
    const filtered = stored.filter((w) => w.address !== address);
    if (filtered.length === 0) {
      this.storage.removeItem(WALLET_STORAGE_KEY);
    } else {
      this.storage.setItem(WALLET_STORAGE_KEY, JSON.stringify(filtered));
    }
  }
  /**
   * Remove all signers.
   *
   * Clears all keypair signers from memory and disconnects all wallets.
   */
  async removeAll() {
    this.keypairSigners.clear();
    if (this.walletAdapter) {
      await this.walletAdapter.disconnect();
    }
    if (this.storage) {
      this.storage.removeItem(WALLET_STORAGE_KEY);
    }
  }
  /**
   * Get all registered external signers.
   *
   * @returns Array of external signer info
   */
  getAll() {
    const signers = [];
    for (const [address] of this.keypairSigners) {
      signers.push({
        address,
        type: "keypair"
      });
    }
    if (this.walletAdapter) {
      const wallets = this.walletAdapter.getConnectedWallets();
      for (const wallet of wallets) {
        if (!this.keypairSigners.has(wallet.address)) {
          signers.push({
            address: wallet.address,
            type: "wallet",
            walletName: wallet.walletName,
            walletId: wallet.walletId
          });
        }
      }
    }
    return signers;
  }
  /**
   * Check if we can sign for a specific address.
   *
   * @param address - The G-address to check
   * @returns True if we have a keypair or connected wallet for this address
   */
  canSignFor(address) {
    if (this.keypairSigners.has(address)) {
      return true;
    }
    if (this.walletAdapter?.canSignFor(address)) {
      return true;
    }
    return false;
  }
  /**
   * Get signer info for a specific address.
   *
   * @param address - The G-address to look up
   * @returns Signer info if found, undefined otherwise
   */
  get(address) {
    if (this.keypairSigners.has(address)) {
      return {
        address,
        type: "keypair"
      };
    }
    if (this.walletAdapter) {
      const wallet = this.walletAdapter.getWalletForAddress?.(address);
      if (wallet) {
        return {
          address: wallet.address,
          type: "wallet",
          walletName: wallet.walletName,
          walletId: wallet.walletId
        };
      }
    }
    return void 0;
  }
  /**
   * Check if any external signers are registered.
   */
  get hasSigners() {
    return this.keypairSigners.size > 0 || (this.walletAdapter?.getConnectedWallets().length ?? 0) > 0;
  }
  /**
   * Sign an auth entry preimage with an external signer.
   *
   * For keypair signers, signs directly with the Keypair.
   * For wallet signers, delegates to the wallet adapter.
   *
   * @param preimageXdr - Base64-encoded HashIdPreimage XDR
   * @param address - The G-address to sign with
   * @returns Base64-encoded signature
   * @throws Error if no signer is available for the address
   *
   * @internal Used by the SDK during multi-signer operations
   */
  async signAuthEntry(preimageXdr, address) {
    const keypairSigner = this.keypairSigners.get(address);
    if (keypairSigner) {
      const preimage = xdr2.HashIdPreimage.fromXDR(preimageXdr, "base64");
      const payload = hash2(preimage.toXDR());
      const signature = keypairSigner.keypair.sign(payload);
      return {
        signedAuthEntry: signature.toString("base64"),
        signerAddress: address
      };
    }
    if (this.walletAdapter?.canSignFor(address)) {
      const result2 = await this.walletAdapter.signAuthEntry(preimageXdr, {
        networkPassphrase: this.networkPassphrase,
        address
      });
      return {
        signedAuthEntry: result2.signedAuthEntry,
        signerAddress: result2.signerAddress ?? address
      };
    }
    throw new Error(`No signer available for address: ${address}`);
  }
  /**
   * Check if the wallet adapter is available and initialized.
   */
  get hasWalletAdapter() {
    return this.walletAdapter !== null;
  }
};

// node_modules/smart-account-kit/dist/indexer.js
var DEFAULT_INDEXER_URLS = {
  "Test SDF Network ; September 2015": "https://smart-account-indexer.sdf-ecosystem.workers.dev"
  // Mainnet URL will be added when available
};
var IndexerClient = class _IndexerClient {
  baseUrl;
  timeout;
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout ?? DEFAULT_INDEXER_TIMEOUT_MS;
  }
  /**
   * Create an IndexerClient for a specific network passphrase.
   * Uses the default indexer URL for known networks.
   *
   * @param networkPassphrase - The Stellar network passphrase
   * @returns IndexerClient configured for the network, or null if no default URL exists
   */
  static forNetwork(networkPassphrase) {
    const url = DEFAULT_INDEXER_URLS[networkPassphrase];
    if (!url)
      return null;
    return new _IndexerClient({ baseUrl: url });
  }
  /**
   * Look up smart account contracts by credential ID.
   *
   * This is the primary lookup method for passkey-based signers.
   * The credential ID comes from WebAuthn authentication.
   *
   * @param credentialId - Hex-encoded credential ID (from passkey)
   * @returns Contracts associated with this credential
   */
  async lookupByCredentialId(credentialId) {
    const normalizedId = credentialId.toLowerCase().replace(/^0x/, "");
    const response = await this.fetch(`${API_PATH_LOOKUP}/${normalizedId}`);
    return {
      ...response,
      contracts: response.contracts.map(this.normalizeContractSummary)
    };
  }
  /**
   * Look up smart account contracts by signer address.
   *
   * This works for both:
   * - G-addresses (Delegated signers)
   * - C-addresses (External signer verifier contracts)
   *
   * @param address - Stellar address (G... or C...)
   * @returns Contracts associated with this address
   */
  async lookupByAddress(address) {
    const response = await this.fetch(`${API_PATH_LOOKUP_ADDRESS}/${address}`);
    return {
      ...response,
      contracts: response.contracts.map(this.normalizeContractSummary)
    };
  }
  /**
   * Get detailed information about a smart account contract.
   *
   * Returns the current state including:
   * - Contract summary statistics
   * - Active context rules (excluding removed ones)
   * - Signers for each rule
   * - Policies for each rule
   *
   * @param contractId - Smart account contract address (C...)
   * @returns Contract details or null if not found
   */
  async getContractDetails(contractId) {
    try {
      const response = await this.fetch(`${API_PATH_CONTRACT}/${contractId}`);
      return {
        ...response,
        summary: this.normalizeContractSummary(response.summary)
      };
    } catch (error) {
      if (error instanceof IndexerError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
  /**
   * Get indexer statistics.
   *
   * Useful for debugging and monitoring.
   */
  async getStats() {
    return this.fetch(API_PATH_STATS);
  }
  /**
   * Check if the indexer is healthy and reachable.
   */
  async isHealthy() {
    try {
      const response = await this.fetch("/");
      return response.status === "ok";
    } catch {
      return false;
    }
  }
  // ============================================================================
  // Private Methods
  // ============================================================================
  async fetch(path) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new IndexerError(`Indexer request failed: ${response.status} ${response.statusText}`, response.status, errorBody);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof IndexerError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new IndexerError("Indexer request timed out", 0);
      }
      throw new IndexerError(`Indexer request failed: ${error instanceof Error ? error.message : String(error)}`, 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Normalize contract summary counts from strings to numbers.
   * PostgreSQL returns bigint as strings in JSON.
   */
  normalizeContractSummary(summary) {
    return {
      ...summary,
      context_rule_count: Number(summary.context_rule_count),
      external_signer_count: Number(summary.external_signer_count),
      delegated_signer_count: Number(summary.delegated_signer_count),
      native_signer_count: Number(summary.native_signer_count),
      first_seen_ledger: Number(summary.first_seen_ledger),
      last_seen_ledger: Number(summary.last_seen_ledger)
    };
  }
};
var IndexerError = class extends Error {
  status;
  body;
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "IndexerError";
  }
};

// node_modules/smart-account-kit/dist/version.js
var VERSION = "0.2.10";
var NAME = "smart-account-kit";

// node_modules/smart-account-kit/dist/relayer.js
var RelayerClient = class {
  url;
  timeout;
  // Default timeout of 6 minutes to accommodate testnet retries (up to 5 min)
  // when Relayer channel accounts need funding after testnet reset.
  // Mainnet requests return quickly; this only affects max wait time.
  constructor(url, timeout = DEFAULT_RELAYER_TIMEOUT_MS) {
    if (!url) {
      throw new Error("Relayer URL is required");
    }
    this.url = url.replace(/\/+$/, "");
    this.timeout = timeout;
  }
  /**
   * Check if the client is properly configured
   */
  get isConfigured() {
    return !!this.url;
  }
  asObject(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    return value;
  }
  looksLikeErrorCode(value) {
    return /^[A-Z][A-Z0-9_:-]*$/.test(value.trim());
  }
  extractResponseData(responseData) {
    const root = this.asObject(responseData);
    if (!root) {
      return {};
    }
    const nested = this.asObject(root.data);
    return nested ?? root;
  }
  hasTransactionFields(value) {
    const data = this.asObject(value);
    if (!data) {
      return false;
    }
    return typeof data.transactionId === "string" || typeof data.hash === "string" || typeof data.status === "string";
  }
  isSuccessResponse(response, responseData) {
    const root = this.asObject(responseData);
    if (!root) {
      return false;
    }
    if (root.success === true) {
      return true;
    }
    if (!response.ok || root.success === false) {
      return false;
    }
    if (this.hasTransactionFields(root)) {
      return true;
    }
    const nested = this.asObject(root.data);
    return this.hasTransactionFields(nested);
  }
  extractErrorMessage(responseData, status) {
    const root = this.asObject(responseData);
    if (!root) {
      return `Relayer request failed with status ${status}`;
    }
    const message = typeof root.message === "string" ? root.message.trim() : "";
    if (message.length > 0) {
      return message;
    }
    const rawError = typeof root.error === "string" ? root.error.trim() : "";
    if (rawError.length > 0 && !this.looksLikeErrorCode(rawError)) {
      return rawError;
    }
    const nested = this.asObject(root.data);
    const nestedMessage = nested && typeof nested.message === "string" ? nested.message.trim() : "";
    if (nestedMessage.length > 0) {
      return nestedMessage;
    }
    if (rawError.length > 0) {
      return rawError;
    }
    return `Relayer request failed with status ${status}`;
  }
  toSuccessResult(responseData) {
    const data = this.extractResponseData(responseData);
    return {
      success: true,
      transactionId: typeof data.transactionId === "string" ? data.transactionId : void 0,
      hash: typeof data.hash === "string" ? data.hash : void 0,
      status: typeof data.status === "string" ? data.status : void 0
    };
  }
  toErrorResult(responseData, status) {
    const errorCode = this.extractErrorCode(responseData);
    return {
      success: false,
      error: this.extractErrorMessage(responseData, status),
      errorCode,
      details: this.extractResponseData(responseData)
    };
  }
  async submit(body, options) {
    const headers = {
      "Content-Type": "application/json",
      "X-Client-Name": NAME,
      "X-Client-Version": VERSION
    };
    try {
      const controller = new AbortController();
      const timeout = options?.timeout ?? this.timeout;
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(this.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
      if (this.isSuccessResponse(response, responseData)) {
        return this.toSuccessResult(responseData);
      }
      return this.toErrorResult(responseData, response.status);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          error: "Relayer request timed out",
          errorCode: "TIMEOUT"
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Relayer request failed",
        details: err
      };
    }
  }
  /**
   * Submit a transaction via Relayer for fee sponsoring.
   *
   * The Relayer builds the transaction envelope using channel accounts and pays the fees.
   * Transactions are submitted in parallel using a pool of channel accounts.
   *
   * @param func - Base64 encoded Soroban host function XDR
   * @param auth - Array of base64 encoded authorization entry XDRs
   * @param options - Optional submission options
   * @returns The submission result
   *
   * @example
   * ```typescript
   * // Extract func and auth from a prepared transaction
   * const funcXdr = hostFunc.toXDR('base64');
   * const authXdrs = authEntries.map(e => e.toXDR('base64'));
   *
   * const result = await relayer.send(funcXdr, authXdrs);
   *
   * if (result.success) {
   *   console.log('Hash:', result.hash);
   * } else {
   *   console.error('Error:', result.error, result.errorCode);
   * }
   * ```
   */
  async send(func, auth, options) {
    return this.submit(JSON.stringify({ func, auth }), options);
  }
  /**
   * Submit a signed transaction for fee-bumping.
   *
   * Use this for transactions that require source_account auth (e.g., deployment).
   * The Relayer will fee-bump the signed transaction, preserving the inner signature.
   *
   * @param transaction - Signed transaction (Transaction object or XDR string)
   * @param options - Optional submission options
   * @returns The submission result
   *
   * @example
   * ```typescript
   * // Sign the deployment transaction
   * deployTx.sign(deployerKeypair);
   *
   * // Submit for fee-bumping
   * const result = await relayer.sendXdr(deployTx);
   * ```
   */
  async sendXdr(transaction, options) {
    const xdr10 = typeof transaction === "string" ? transaction : transaction.toXDR();
    return this.submit(JSON.stringify({ xdr: xdr10 }), options);
  }
  /**
   * Extract error code from Relayer response
   */
  extractErrorCode(responseData) {
    const data = this.asObject(responseData);
    if (!data) {
      return void 0;
    }
    if (typeof data.code === "string") {
      return data.code;
    }
    if (typeof data.errorCode === "string") {
      return data.errorCode;
    }
    if (data.data && typeof data.data === "object") {
      const nestedData = data.data;
      if (typeof nestedData.code === "string") {
        return nestedData.code;
      }
      if (typeof nestedData.errorCode === "string") {
        return nestedData.errorCode;
      }
      if (typeof nestedData.error === "string" && this.looksLikeErrorCode(nestedData.error)) {
        return nestedData.error;
      }
    }
    if (typeof data.error === "string" && this.looksLikeErrorCode(data.error)) {
      return data.error;
    }
    return void 0;
  }
};

// node_modules/smart-account-kit/dist/managers/signer-manager.js
var import_base64url2 = __toESM(require_base64url2(), 1);
var SignerManager = class {
  deps;
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Add a new passkey signer to a context rule.
   * Creates a new WebAuthn passkey and registers it as an External signer.
   */
  async addPasskey(contextRuleId, appName, userName, options) {
    const { wallet, contractId } = this.deps.requireWallet();
    const { rawResponse, credentialId, publicKey } = await this.deps.createPasskey(appName, userName);
    const storedCredential = {
      credentialId,
      publicKey,
      contractId,
      nickname: options?.nickname ?? `${userName} - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
      createdAt: Date.now(),
      transports: rawResponse.response.transports,
      isPrimary: false,
      contextRuleId
    };
    await this.deps.storage.save(storedCredential);
    this.deps.events.emit("credentialCreated", { credential: storedCredential });
    const keyData = buildKeyData(publicKey, credentialId);
    const signer = {
      tag: "External",
      values: [this.deps.webauthnVerifierAddress, keyData]
    };
    const transaction = await wallet.add_signer({
      context_rule_id: contextRuleId,
      signer
    });
    return {
      credentialId,
      publicKey,
      transaction
    };
  }
  /**
   * Add a delegated signer (Stellar account) to a context rule.
   */
  async addDelegated(contextRuleId, publicKey) {
    const { wallet } = this.deps.requireWallet();
    const signer = {
      tag: "Delegated",
      values: [publicKey]
    };
    return wallet.add_signer({
      context_rule_id: contextRuleId,
      signer
    });
  }
  /**
   * Remove a signer from a context rule.
   */
  async remove(contextRuleId, signer) {
    const { wallet } = this.deps.requireWallet();
    if (signer.tag === "External") {
      const keyData = signer.values[1];
      if (keyData.length > SECP256R1_PUBLIC_KEY_SIZE) {
        const credentialId = import_base64url2.default.encode(keyData.slice(SECP256R1_PUBLIC_KEY_SIZE));
        await this.deps.storage.delete(credentialId);
      }
    }
    return wallet.remove_signer({
      context_rule_id: contextRuleId,
      signer
    });
  }
  /**
   * Remove a passkey signer by credential ID.
   */
  async removePasskey(contextRuleId, credentialId) {
    const credential = await this.deps.storage.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found in storage`);
    }
    const keyData = buildKeyData(credential.publicKey, credentialId);
    const signer = {
      tag: "External",
      values: [this.deps.webauthnVerifierAddress, keyData]
    };
    return this.remove(contextRuleId, signer);
  }
};

// node_modules/smart-account-kit/dist/managers/context-rule-manager.js
var ContextRuleManager = class {
  deps;
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Add a new context rule to the smart account.
   *
   * @param contextType - When this rule applies (Default, CallContract, CreateContract)
   * @param name - Human-readable name for the rule
   * @param signers - Array of signers that can authorize under this rule
   * @param policies - Map of policy addresses to their parameters
   * @param validUntil - Optional ledger number when this rule expires
   * @returns Assembled transaction that creates the rule when signed and sent
   * @throws Error if not connected to a wallet
   */
  async add(contextType, name, signers, policies, validUntil) {
    return this.deps.requireWallet().wallet.add_context_rule({
      context_type: contextType,
      name,
      valid_until: validUntil,
      signers,
      policies
    });
  }
  /**
   * Get a context rule by its ID.
   *
   * @param contextRuleId - The numeric ID of the rule to retrieve
   * @returns Assembled transaction that returns the rule (or undefined if not found)
   * @throws Error if not connected to a wallet
   */
  async get(contextRuleId) {
    return this.deps.requireWallet().wallet.get_context_rule({
      context_rule_id: contextRuleId
    });
  }
  /**
   * Get all context rules of a specific type.
   *
   * @param contextRuleType - The type of rules to retrieve (Default, CallContract, CreateContract)
   * @returns Assembled transaction that returns an array of matching rules
   * @throws Error if not connected to a wallet
   */
  async getAll(contextRuleType) {
    return this.deps.requireWallet().wallet.get_context_rules({
      context_rule_type: contextRuleType
    });
  }
  /**
   * Remove a context rule from the smart account.
   *
   * @param contextRuleId - The numeric ID of the rule to remove
   * @returns Assembled transaction that removes the rule when signed and sent
   * @throws Error if not connected to a wallet
   */
  async remove(contextRuleId) {
    return this.deps.requireWallet().wallet.remove_context_rule({
      context_rule_id: contextRuleId
    });
  }
  /**
   * Update the name of a context rule.
   *
   * @param contextRuleId - The numeric ID of the rule to update
   * @param name - The new name for the rule
   * @returns Assembled transaction that updates the rule when signed and sent
   * @throws Error if not connected to a wallet
   */
  async updateName(contextRuleId, name) {
    return this.deps.requireWallet().wallet.update_context_rule_name({
      context_rule_id: contextRuleId,
      name
    });
  }
  /**
   * Update the expiration of a context rule.
   *
   * @param contextRuleId - The numeric ID of the rule to update
   * @param validUntil - The new expiration ledger number (undefined for no expiration)
   * @returns Assembled transaction that updates the rule when signed and sent
   * @throws Error if not connected to a wallet
   */
  async updateExpiration(contextRuleId, validUntil) {
    return this.deps.requireWallet().wallet.update_context_rule_valid_until({
      context_rule_id: contextRuleId,
      valid_until: validUntil
    });
  }
};

// node_modules/smart-account-kit/dist/managers/policy-manager.js
var PolicyManager = class {
  deps;
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Add a policy to a context rule.
   *
   * @param contextRuleId - The numeric ID of the context rule to add the policy to
   * @param policyAddress - The contract address of the policy to add
   * @param installParams - Policy-specific installation parameters
   * @returns Assembled transaction that adds the policy when signed and sent
   * @throws Error if not connected to a wallet
   */
  async add(contextRuleId, policyAddress, installParams) {
    return this.deps.requireWallet().wallet.add_policy({
      context_rule_id: contextRuleId,
      policy: policyAddress,
      install_param: installParams
    });
  }
  /**
   * Remove a policy from a context rule.
   *
   * @param contextRuleId - The numeric ID of the context rule to remove the policy from
   * @param policyAddress - The contract address of the policy to remove
   * @returns Assembled transaction that removes the policy when signed and sent
   * @throws Error if not connected to a wallet
   */
  async remove(contextRuleId, policyAddress) {
    return this.deps.requireWallet().wallet.remove_policy({
      context_rule_id: contextRuleId,
      policy: policyAddress
    });
  }
};

// node_modules/smart-account-kit/dist/managers/credential-manager.js
var import_base64url3 = __toESM(require_base64url2(), 1);
import { xdr as xdr3 } from "@stellar/stellar-sdk";
var CredentialManager = class {
  deps;
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Get all stored credentials.
   */
  async getAll() {
    return this.deps.storage.getAll();
  }
  /**
   * Get credentials for the current wallet.
   */
  async getForWallet() {
    const contractId = this.deps.getContractId();
    if (!contractId) {
      return [];
    }
    return this.deps.storage.getByContract(contractId);
  }
  /**
   * Get credentials that are pending deployment.
   */
  async getPending() {
    const all = await this.deps.storage.getAll();
    return all.filter((c) => c.deploymentStatus === "pending" || c.deploymentStatus === "failed");
  }
  /**
   * Create a new passkey and save it to storage.
   */
  async create(options) {
    const now = /* @__PURE__ */ new Date();
    const nickname = options?.nickname || `Passkey ${now.toLocaleDateString()}`;
    const appName = options?.appName || this.deps.rpName;
    const { rawResponse, credentialId, publicKey } = await this.deps.createPasskey(appName, nickname);
    const storedCredential = {
      credentialId,
      publicKey,
      contractId: "",
      nickname,
      createdAt: Date.now(),
      transports: rawResponse?.response?.transports,
      deploymentStatus: "pending"
    };
    await this.deps.storage.save(storedCredential);
    this.deps.events.emit("credentialCreated", { credential: storedCredential });
    return storedCredential;
  }
  /**
   * Save a credential to storage.
   */
  async save(credential) {
    const storedCredential = {
      credentialId: credential.credentialId,
      publicKey: credential.publicKey,
      contractId: credential.contractId || "",
      nickname: credential.nickname,
      createdAt: Date.now(),
      deploymentStatus: "pending"
    };
    await this.deps.storage.save(storedCredential);
    return storedCredential;
  }
  /**
   * Deploy a wallet using an existing pending credential.
   */
  async deploy(credentialId, options) {
    const credential = await this.deps.storage.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found in storage`);
    }
    const credentialIdBuffer = import_base64url3.default.toBuffer(credentialId);
    const contractId = this.deps.deriveContractAddress(credentialIdBuffer);
    const deployTx = await this.deps.buildDeployTransaction(credentialIdBuffer, credential.publicKey);
    const submissionOpts = { forceMethod: options?.forceMethod };
    await this.deps.signWithDeployer(deployTx);
    if (!deployTx.signed) {
      throw new Error("Failed to sign deployment transaction");
    }
    const signedTransaction = deployTx.signed.toXDR();
    this.deps.setConnectedState(contractId, credentialId);
    this.deps.initializeWallet(contractId);
    this.deps.events.emit("walletConnected", { contractId, credentialId });
    const submitResult = options?.autoSubmit ? await this.deps.submitDeploymentTx(deployTx, credentialId, submissionOpts) : void 0;
    return {
      contractId,
      signedTransaction,
      submitResult
    };
  }
  /**
   * Mark a credential as deployed (removes from storage).
   */
  async markDeployed(credentialId) {
    await this.deps.storage.delete(credentialId);
  }
  /**
   * Mark a credential as failed.
   */
  async markFailed(credentialId, error) {
    await this.deps.storage.update(credentialId, {
      deploymentStatus: "failed",
      deploymentError: error
    });
  }
  /**
   * Sync a credential with on-chain state.
   * If deployed, removes from storage. Returns true if deployed.
   */
  async sync(credentialId) {
    const credential = await this.deps.storage.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found in storage`);
    }
    try {
      await this.deps.rpc.getContractData(credential.contractId, xdr3.ScVal.scvLedgerKeyContractInstance());
      await this.deps.storage.delete(credentialId);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Sync all stored credentials with on-chain state.
   */
  async syncAll() {
    const all = await this.deps.storage.getAll();
    let deployed = 0;
    let pending = 0;
    let failed = 0;
    for (const credential of all) {
      const exists = await this.sync(credential.credentialId);
      if (exists) {
        deployed++;
      } else if (credential.deploymentStatus === "failed") {
        failed++;
      } else {
        pending++;
      }
    }
    return { deployed, pending, failed };
  }
  /**
   * Delete a pending credential.
   */
  async delete(credentialId) {
    const credential = await this.deps.storage.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found in storage`);
    }
    const isDeployed = await this.sync(credentialId);
    if (isDeployed) {
      throw new Error("Cannot delete a deployed credential. The wallet exists on-chain.");
    }
    await this.deps.storage.delete(credentialId);
  }
};

// node_modules/smart-account-kit/dist/managers/multi-signer-manager.js
import { Address as Address2, hash as hash3, Operation, TransactionBuilder, xdr as xdr4, rpc as rpcModule } from "@stellar/stellar-sdk";

// node_modules/smart-account-kit/dist/builders.js
function getCredentialIdFromSigner(signer) {
  if (signer.tag !== "External") {
    return null;
  }
  const keyData = signer.values[1];
  if (keyData.length <= SECP256R1_PUBLIC_KEY_SIZE) {
    return null;
  }
  const credentialId = keyData.slice(SECP256R1_PUBLIC_KEY_SIZE);
  return credentialId.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function getSignerKey(signer) {
  if (signer.tag === "Delegated") {
    return `delegated:${signer.values[0]}`;
  }
  const keyData = signer.values[1];
  return `external:${signer.values[0]}:${keyData.toString("hex")}`;
}
function collectUniqueSigners(signers) {
  const signerMap = /* @__PURE__ */ new Map();
  for (const signer of signers) {
    const key = getSignerKey(signer);
    if (!signerMap.has(key)) {
      signerMap.set(key, signer);
    }
  }
  return Array.from(signerMap.values());
}

// node_modules/smart-account-kit/dist/managers/multi-signer-manager.js
var { assembleTransaction } = rpcModule;
function isSendTransactionResult(value) {
  return typeof value === "object" && value !== null && "status" in value && typeof value.status === "string";
}
var MultiSignerManager = class {
  deps;
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Get available signers from on-chain context rules.
   */
  async getAvailableSigners() {
    if (!this.deps.isConnected()) {
      return [];
    }
    try {
      const defaultRulesResult = await this.deps.getRules({
        tag: "Default",
        values: void 0
      });
      const defaultRules = defaultRulesResult.result || [];
      const allSigners = defaultRules.flatMap((rule) => rule.signers);
      return collectUniqueSigners(allSigners);
    } catch (error) {
      console.warn("[SmartAccountKit] Failed to fetch available signers:", error);
      return [];
    }
  }
  /**
   * Extract credential ID from a signer.
   */
  extractCredentialId(signer) {
    return getCredentialIdFromSigner(signer);
  }
  /**
   * Check if a signer matches a credential ID.
   */
  signerMatchesCredential(signer, credentialId) {
    const signerCredId = this.extractCredentialId(signer);
    return signerCredId === credentialId;
  }
  /**
   * Check if a signer matches a wallet address.
   */
  signerMatchesAddress(signer, address) {
    if (signer.tag !== "Delegated")
      return false;
    return signer.values[0] === address;
  }
  /**
   * Check if an operation needs multi-signer handling.
   */
  needsMultiSigner(signers) {
    const hasDelegated = signers.some((s) => s.tag === "Delegated");
    const hasMultiple = signers.length > 1;
    return hasDelegated || hasMultiple;
  }
  /**
   * Build selected signers from available signers.
   */
  buildSelectedSigners(signers, activeCredentialId) {
    const selected = [];
    for (const signer of signers) {
      if (signer.tag === "Delegated") {
        const address = signer.values[0];
        if (this.deps.externalSigners.canSignFor(address)) {
          selected.push({
            signer,
            type: "wallet",
            walletAddress: address
          });
        }
      } else {
        const credId = this.extractCredentialId(signer);
        if (credId && (!activeCredentialId || credId === activeCredentialId)) {
          selected.push({
            signer,
            type: "passkey",
            credentialId: credId
          });
        }
      }
    }
    return selected;
  }
  /**
   * Execute a generic smart account operation with multiple signers.
   */
  async operation(assembledTx, selectedSigners2, options) {
    const onLog = options?.onLog ?? (() => {
    });
    const contractId = this.deps.getContractId();
    if (!contractId) {
      return { success: false, hash: "", error: "Not connected to a wallet" };
    }
    const passkeySigners = selectedSigners2.filter((s) => s.type === "passkey");
    const walletSigners = selectedSigners2.filter((s) => s.type === "wallet");
    onLog(`Signing with ${passkeySigners.length} passkey(s) and ${walletSigners.length} wallet(s)`);
    for (const walletSigner of walletSigners) {
      if (!walletSigner.walletAddress)
        continue;
      if (!this.deps.externalSigners.canSignFor(walletSigner.walletAddress)) {
        return {
          success: false,
          hash: "",
          error: `No signer available for address: ${walletSigner.walletAddress}. Use kit.externalSigners.addFromSecret() or kit.externalSigners.addFromWallet() to add a signer.`
        };
      }
    }
    try {
      const builtTx = assembledTx.built;
      if (!builtTx) {
        return { success: false, hash: "", error: "Transaction not built" };
      }
      const ops = builtTx.operations;
      if (!ops || ops.length === 0) {
        return { success: false, hash: "", error: "No operations in transaction" };
      }
      const invokeOp = ops[0];
      const authEntries = invokeOp.auth || [];
      onLog(`Found ${authEntries.length} auth entries to sign`);
      if (authEntries.length === 0) {
        onLog("No auth entries - submitting directly...");
        const result2 = await assembledTx.signAndSend();
        if (!isSendTransactionResult(result2)) {
          return { success: false, hash: "", error: "Unexpected transaction result format" };
        }
        return {
          success: result2.status === "SUCCESS",
          hash: result2.hash || "",
          error: result2.status !== "SUCCESS" ? "Transaction failed" : void 0
        };
      }
      const signedAuthEntries = [];
      const { sequence } = await this.deps.rpc.getLatestLedger();
      const expiration = sequence + AUTH_ENTRY_EXPIRATION_BUFFER;
      for (const entry of authEntries) {
        const credentials = entry.credentials();
        if (credentials.switch().name !== "sorobanCredentialsAddress") {
          signedAuthEntries.push(entry);
          continue;
        }
        const addressCreds = credentials.address();
        const authAddress = Address2.fromScAddress(addressCreds.address()).toString();
        if (authAddress === contractId) {
          let signedEntry = xdr4.SorobanAuthorizationEntry.fromXDR(entry.toXDR());
          signedEntry.credentials().address().signatureExpirationLedger(expiration);
          for (let i = 0; i < passkeySigners.length; i++) {
            const passkeySigner = passkeySigners[i];
            onLog(`Signing with passkey ${i + 1}/${passkeySigners.length}...`);
            signedEntry = await this.deps.signAuthEntry(signedEntry, {
              credentialId: passkeySigner?.credentialId,
              expiration
            });
          }
          for (const walletSigner of walletSigners) {
            if (!walletSigner.walletAddress)
              continue;
            const delegatedSignerKey = xdr4.ScVal.scvVec([
              xdr4.ScVal.scvSymbol("Delegated"),
              xdr4.ScVal.scvAddress(Address2.fromString(walletSigner.walletAddress).toScAddress())
            ]);
            const ourSig = signedEntry.credentials().address().signature();
            const emptyBytes = xdr4.ScVal.scvBytes(Buffer.alloc(0));
            if (ourSig.switch().name === "scvVoid") {
              signedEntry.credentials().address().signature(xdr4.ScVal.scvVec([
                xdr4.ScVal.scvMap([
                  new xdr4.ScMapEntry({ key: delegatedSignerKey, val: emptyBytes })
                ])
              ]));
            } else {
              const sigMap = ourSig.vec()?.[0].map();
              if (sigMap) {
                sigMap.push(new xdr4.ScMapEntry({ key: delegatedSignerKey, val: emptyBytes }));
                sigMap.sort((a, b) => a.key().toXDR("hex").localeCompare(b.key().toXDR("hex")));
              }
            }
          }
          signedAuthEntries.push(signedEntry);
          if (walletSigners.length > 0) {
            onLog(`Creating auth entries for ${walletSigners.length} delegated signer(s)...`);
            const smartAccountPreimage = xdr4.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr4.HashIdPreimageSorobanAuthorization({
              networkId: hash3(Buffer.from(this.deps.networkPassphrase)),
              nonce: signedEntry.credentials().address().nonce(),
              signatureExpirationLedger: expiration,
              invocation: signedEntry.rootInvocation()
            }));
            const signaturePayload = hash3(smartAccountPreimage.toXDR());
            for (const walletSigner of walletSigners) {
              if (!walletSigner.walletAddress)
                continue;
              onLog(`Getting delegated auth from ${walletSigner.walletAddress.slice(0, 8)}...`);
              const delegatedNonce = xdr4.Int64.fromString(Date.now().toString());
              const delegatedInvocation = new xdr4.SorobanAuthorizedInvocation({
                function: xdr4.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(new xdr4.InvokeContractArgs({
                  contractAddress: Address2.fromString(contractId).toScAddress(),
                  functionName: "__check_auth",
                  args: [xdr4.ScVal.scvBytes(signaturePayload)]
                })),
                subInvocations: []
              });
              const delegatedPreimage = xdr4.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr4.HashIdPreimageSorobanAuthorization({
                networkId: hash3(Buffer.from(this.deps.networkPassphrase)),
                nonce: delegatedNonce,
                signatureExpirationLedger: expiration,
                invocation: delegatedInvocation
              }));
              const { signedAuthEntry: walletSignatureBase64 } = await this.deps.externalSigners.signAuthEntry(delegatedPreimage.toXDR("base64"), walletSigner.walletAddress);
              const signatureBytes = Buffer.from(walletSignatureBase64, "base64");
              const walletPublicKeyBytes = Address2.fromString(walletSigner.walletAddress).toScAddress().accountId().ed25519();
              const signatureScVal = xdr4.ScVal.scvVec([
                xdr4.ScVal.scvMap([
                  new xdr4.ScMapEntry({
                    key: xdr4.ScVal.scvSymbol("public_key"),
                    val: xdr4.ScVal.scvBytes(walletPublicKeyBytes)
                  }),
                  new xdr4.ScMapEntry({
                    key: xdr4.ScVal.scvSymbol("signature"),
                    val: xdr4.ScVal.scvBytes(signatureBytes)
                  })
                ])
              ]);
              const walletSignedEntry = new xdr4.SorobanAuthorizationEntry({
                credentials: xdr4.SorobanCredentials.sorobanCredentialsAddress(new xdr4.SorobanAddressCredentials({
                  address: Address2.fromString(walletSigner.walletAddress).toScAddress(),
                  nonce: delegatedNonce,
                  signatureExpirationLedger: expiration,
                  signature: signatureScVal
                })),
                rootInvocation: delegatedInvocation
              });
              signedAuthEntries.push(walletSignedEntry);
            }
          }
        } else {
          signedAuthEntries.push(entry);
        }
      }
      onLog("Re-simulating with signatures...");
      const freshSourceAccount = await this.deps.rpc.getAccount(this.deps.deployerPublicKey);
      const hostFunc = ops[0].func;
      const resimTx = new TransactionBuilder(freshSourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.deps.networkPassphrase
      }).addOperation(Operation.invokeHostFunction({
        func: hostFunc,
        auth: signedAuthEntries
      })).setTimeout(this.deps.timeoutInSeconds).build();
      const resimResult = await this.deps.rpc.simulateTransaction(resimTx);
      if ("error" in resimResult) {
        return { success: false, hash: "", error: `Re-simulation failed: ${resimResult.error}` };
      }
      const resimTxXdr = resimTx.toXDR();
      const normalizedTx = TransactionBuilder.fromXDR(resimTxXdr, this.deps.networkPassphrase);
      const assembled = assembleTransaction(normalizedTx, resimResult);
      const preparedTx = assembled.build();
      if (!this.deps.shouldUseFeeSponsoring() || this.deps.hasSourceAccountAuth(preparedTx)) {
        preparedTx.sign(this.deps.deployerKeypair);
      }
      onLog("Submitting transaction...");
      return this.deps.sendAndPoll(preparedTx);
    } catch (err) {
      return {
        success: false,
        hash: "",
        error: err instanceof Error ? err.message : "Unknown error"
      };
    }
  }
  /**
   * Execute a transfer with multiple signers.
   * Delegates to the kit's implementation which handles the complex XDR building.
   */
  async transfer(tokenContract, recipient, amount, selectedSigners2, options) {
    return this.deps.executeTransfer(tokenContract, recipient, amount, selectedSigners2, options);
  }
};

// node_modules/smart-account-kit/dist/kit/indexer-ops.js
var import_base64url4 = __toESM(require_base64url2(), 1);
async function discoverContractsByCredential(indexer, credentialId) {
  if (!indexer)
    return null;
  const hexCredentialId = normalizeCredentialIdToHex(credentialId);
  const result2 = await indexer.lookupByCredentialId(hexCredentialId);
  return result2.contracts;
}
async function discoverContractsByAddress(indexer, address) {
  if (!indexer)
    return null;
  const result2 = await indexer.lookupByAddress(address);
  return result2.contracts;
}
async function getContractDetailsFromIndexer(indexer, contractId) {
  if (!indexer)
    return null;
  return indexer.getContractDetails(contractId);
}
function normalizeCredentialIdToHex(credentialId) {
  if (/^[0-9a-fA-F]+$/.test(credentialId)) {
    return credentialId.toLowerCase();
  }
  try {
    const bytes = import_base64url4.default.toBuffer(credentialId);
    return bytes.toString("hex");
  } catch {
    return credentialId.toLowerCase();
  }
}

// node_modules/smart-account-kit/dist/kit/webauthn-ops.js
var import_base64url5 = __toESM(require_base64url2(), 1);
import { Address as Address3, hash as hash4, xdr as xdr5 } from "@stellar/stellar-sdk";
async function createPasskey(deps, appName, userName, authenticatorSelection) {
  const now = /* @__PURE__ */ new Date();
  const displayName = `${userName} \u2014 ${now.toLocaleString()}`;
  const options = {
    challenge: generateChallenge(),
    rp: {
      id: deps.rpId,
      name: appName || deps.rpName
    },
    user: {
      id: (0, import_base64url5.default)(`${userName}:${now.getTime()}:${Math.random()}`),
      name: displayName,
      displayName
    },
    authenticatorSelection: {
      residentKey: authenticatorSelection?.residentKey ?? "preferred",
      userVerification: authenticatorSelection?.userVerification ?? "preferred",
      authenticatorAttachment: authenticatorSelection?.authenticatorAttachment
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    timeout: WEBAUTHN_TIMEOUT_MS
  };
  const rawResponse = await deps.webAuthn.startRegistration({ optionsJSON: options });
  const publicKey = await extractPublicKeyFromAttestation(rawResponse.response);
  return {
    rawResponse,
    credentialId: rawResponse.id,
    publicKey
  };
}
async function authenticatePasskey(deps) {
  const authOptions = {
    challenge: generateChallenge(),
    rpId: deps.rpId,
    userVerification: "preferred",
    timeout: WEBAUTHN_TIMEOUT_MS
  };
  const rawResponse = await deps.webAuthn.startAuthentication({ optionsJSON: authOptions });
  return {
    credentialId: rawResponse.id,
    rawResponse
  };
}
async function signAuthEntry(deps, entry, options) {
  const entryXdrBytes = entry.toXDR();
  const normalizedEntry = xdr5.SorobanAuthorizationEntry.fromXDR(entryXdrBytes);
  const credentials = normalizedEntry.credentials().address();
  const expiration = options?.expiration ?? await deps.calculateExpiration();
  credentials.signatureExpirationLedger(expiration);
  const preimage = xdr5.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr5.HashIdPreimageSorobanAuthorization({
    networkId: hash4(Buffer.from(deps.networkPassphrase)),
    nonce: credentials.nonce(),
    signatureExpirationLedger: credentials.signatureExpirationLedger(),
    invocation: normalizedEntry.rootInvocation()
  }));
  const payload = hash4(preimage.toXDR());
  const credentialId = options?.credentialId ?? deps.getCredentialId();
  const authOptions = {
    challenge: (0, import_base64url5.default)(payload),
    rpId: deps.rpId,
    userVerification: "preferred",
    timeout: WEBAUTHN_TIMEOUT_MS,
    ...credentialId && {
      allowCredentials: [{ id: credentialId, type: "public-key" }]
    }
  };
  const authResponse = await deps.webAuthn.startAuthentication({
    optionsJSON: authOptions
  });
  const rawSignature = import_base64url5.default.toBuffer(authResponse.response.signature);
  const compactedSignature = compactSignature(rawSignature);
  const credentialIdBuffer = import_base64url5.default.toBuffer(authResponse.id);
  const contextRuleTypes = buildContextRuleTypes(normalizedEntry);
  const keyData = await findKeyDataByCredentialId(deps.requireWallet, credentialIdBuffer, contextRuleTypes);
  const signerId = {
    tag: "External",
    values: [
      deps.webauthnVerifierAddress,
      keyData
    ]
  };
  const webAuthnSigData = {
    authenticator_data: import_base64url5.default.toBuffer(authResponse.response.authenticatorData),
    client_data: import_base64url5.default.toBuffer(authResponse.response.clientDataJSON),
    signature: Buffer.from(compactedSignature)
  };
  const scMapEntry = buildSignatureMapEntry(signerId, webAuthnSigData);
  const currentSig = credentials.signature();
  if (currentSig.switch().name === "scvVoid") {
    credentials.signature(xdr5.ScVal.scvVec([xdr5.ScVal.scvMap([scMapEntry])]));
  } else {
    currentSig.vec()?.[0].map()?.push(scMapEntry);
  }
  const sigMap = credentials.signature().vec()?.[0].map();
  if (sigMap && sigMap.length > 1) {
    sigMap.sort((a, b) => {
      const aKeyXdr = a.key().toXDR("hex");
      const bKeyXdr = b.key().toXDR("hex");
      return aKeyXdr.localeCompare(bKeyXdr);
    });
  }
  if (credentialId) {
    await deps.storage.update(credentialId, { lastUsedAt: Date.now() });
  }
  return normalizedEntry;
}
async function findKeyDataByCredentialId(requireWallet, credentialId, contextRuleTypes) {
  const { wallet } = requireWallet();
  for (const contextRuleType of contextRuleTypes) {
    const rulesResult = await wallet.get_context_rules({
      context_rule_type: contextRuleType
    });
    const rules = rulesResult.result;
    for (const rule of rules) {
      for (const signer of rule.signers) {
        if (signer.tag === "External") {
          const keyData = signer.values[1];
          if (keyData.length > SECP256R1_PUBLIC_KEY_SIZE) {
            const suffix = keyData.slice(SECP256R1_PUBLIC_KEY_SIZE);
            if (suffix.equals(credentialId)) {
              return keyData;
            }
          }
        }
      }
    }
  }
  throw new Error(`No signer found for credential ID: ${credentialId.toString("base64")}`);
}
function buildContextRuleTypes(entry) {
  const types = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (type) => {
    let key;
    if (type.tag === "Default") {
      key = "Default";
    } else if (type.tag === "CallContract") {
      key = `CallContract:${type.values[0]}`;
    } else {
      const wasm = Buffer.from(type.values[0]);
      key = `CreateContract:${wasm.toString("hex")}`;
    }
    if (!seen.has(key)) {
      seen.add(key);
      types.push(type);
    }
  };
  const walk = (invocation) => {
    const fn = invocation.function();
    const switchName = fn.switch().name;
    if (switchName === "sorobanAuthorizedFunctionTypeContractFn") {
      const args2 = fn.contractFn();
      const contractAddress = Address3.fromScAddress(args2.contractAddress()).toString();
      add({ tag: "CallContract", values: [contractAddress] });
    } else if (switchName.startsWith("sorobanAuthorizedFunctionTypeCreateContract")) {
      const wasmHash = extractCreateContractWasmHash(fn);
      if (wasmHash) {
        add({ tag: "CreateContract", values: [wasmHash] });
      }
    }
    for (const sub of invocation.subInvocations()) {
      walk(sub);
    }
  };
  walk(entry.rootInvocation());
  add({ tag: "Default", values: void 0 });
  return types;
}
function extractCreateContractWasmHash(fn) {
  const candidates = [];
  const fnAny = fn;
  if (typeof fnAny.createContractHostFn === "function") {
    candidates.push(fnAny.createContractHostFn());
  }
  if (typeof fnAny.createContractWithCtorHostFn === "function") {
    candidates.push(fnAny.createContractWithCtorHostFn());
  }
  if (typeof fnAny.createContractWithConstructorHostFn === "function") {
    candidates.push(fnAny.createContractWithConstructorHostFn());
  }
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object")
      continue;
    const ctx = candidate;
    const executable = typeof ctx.executable === "function" ? ctx.executable() : ctx.executable;
    if (!executable || typeof executable !== "object")
      continue;
    const execAny = executable;
    const execSwitch = execAny.switch?.();
    if (execSwitch && execSwitch.name === "contractExecutableWasm") {
      const wasm = typeof execAny.wasm === "function" ? execAny.wasm() : execAny.wasm;
      if (wasm) {
        return Buffer.from(wasm);
      }
    }
  }
  return null;
}
function buildSignatureMapEntry(signerId, sigData) {
  let keyVal;
  if (signerId.tag === "Delegated") {
    keyVal = xdr5.ScVal.scvVec([
      xdr5.ScVal.scvSymbol("Delegated"),
      xdr5.ScVal.scvAddress(Address3.fromString(signerId.values[0]).toScAddress())
    ]);
  } else {
    keyVal = xdr5.ScVal.scvVec([
      xdr5.ScVal.scvSymbol("External"),
      xdr5.ScVal.scvAddress(Address3.fromString(signerId.values[0]).toScAddress()),
      xdr5.ScVal.scvBytes(signerId.values[1])
    ]);
  }
  const sigDataScVal = xdr5.ScVal.scvMap([
    new xdr5.ScMapEntry({
      key: xdr5.ScVal.scvSymbol("authenticator_data"),
      val: xdr5.ScVal.scvBytes(sigData.authenticator_data)
    }),
    new xdr5.ScMapEntry({
      key: xdr5.ScVal.scvSymbol("client_data"),
      val: xdr5.ScVal.scvBytes(sigData.client_data)
    }),
    new xdr5.ScMapEntry({
      key: xdr5.ScVal.scvSymbol("signature"),
      val: xdr5.ScVal.scvBytes(sigData.signature)
    })
  ]);
  const sigDataXdrBytes = sigDataScVal.toXDR();
  const sigVal = xdr5.ScVal.scvBytes(sigDataXdrBytes);
  return new xdr5.ScMapEntry({
    key: keyVal,
    val: sigVal
  });
}

// node_modules/smart-account-kit/dist/kit/wallet-ops.js
var import_base64url6 = __toESM(require_base64url2(), 1);
import { xdr as xdr6 } from "@stellar/stellar-sdk";
async function createWallet(deps, appName, userName, options) {
  const { rawResponse, credentialId, publicKey } = await deps.createPasskey(appName, userName, options?.authenticatorSelection);
  const storedCredential = {
    credentialId,
    publicKey,
    contractId: deriveContractAddress(import_base64url6.default.toBuffer(credentialId), deps.deployerKeypair.publicKey(), deps.networkPassphrase),
    nickname: options?.nickname ?? `${userName} - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
    createdAt: Date.now(),
    transports: rawResponse?.response?.transports,
    isPrimary: true,
    deploymentStatus: "pending"
  };
  await deps.storage.save(storedCredential);
  deps.events.emit("credentialCreated", { credential: storedCredential });
  const credentialIdBuffer = import_base64url6.default.toBuffer(credentialId);
  const contractId = deriveContractAddress(credentialIdBuffer, deps.deployerKeypair.publicKey(), deps.networkPassphrase);
  const deployTx = await deps.buildDeployTransaction(credentialIdBuffer, publicKey);
  const submissionOpts = { forceMethod: options?.forceMethod };
  await deps.signWithDeployer(deployTx);
  if (!deployTx.signed) {
    throw new Error("Failed to sign deployment transaction");
  }
  const signedTransaction = deployTx.signed.toXDR();
  deps.setConnectedState(contractId, credentialId);
  deps.events.emit("walletConnected", { contractId, credentialId });
  const now = Date.now();
  await deps.storage.saveSession({
    contractId,
    credentialId,
    connectedAt: now,
    expiresAt: now + (deps.sessionExpiryMs ?? DEFAULT_SESSION_EXPIRY_MS)
  });
  const submitResult = options?.autoSubmit ? await deps.submitDeploymentTx(deployTx, credentialId, submissionOpts) : void 0;
  let fundResult;
  if (options?.autoFund && submitResult?.success) {
    if (!options.nativeTokenContract) {
      fundResult = { success: false, hash: "", error: "nativeTokenContract is required for autoFund" };
    } else {
      fundResult = await deps.fundWallet(options.nativeTokenContract, { forceMethod: options?.forceMethod });
    }
  }
  return {
    rawResponse,
    credentialId,
    publicKey,
    contractId,
    signedTransaction,
    submitResult,
    fundResult
  };
}
async function connectWallet(deps, options) {
  let credentialId = options?.credentialId;
  let contractId = options?.contractId;
  let rawResponse;
  if (credentialId || contractId) {
    return deps.connectWithCredentials(credentialId, contractId);
  }
  if (!options?.fresh) {
    const session = await deps.storage.getSession();
    if (session) {
      if (session.expiresAt && Date.now() > session.expiresAt) {
        deps.events.emit("sessionExpired", {
          contractId: session.contractId,
          credentialId: session.credentialId
        });
        await deps.storage.clearSession();
      } else {
        return deps.connectWithCredentials(session.credentialId, session.contractId);
      }
    }
  }
  if (!options?.prompt && !options?.fresh) {
    return null;
  }
  const authOptions = {
    challenge: generateChallenge(),
    rpId: deps.rpId,
    userVerification: "preferred",
    timeout: WEBAUTHN_TIMEOUT_MS
  };
  rawResponse = await deps.webAuthn.startAuthentication({ optionsJSON: authOptions });
  credentialId = rawResponse.id;
  const result2 = await deps.connectWithCredentials(credentialId);
  return {
    ...result2,
    rawResponse
  };
}
async function connectWithCredentials(deps, credentialId, contractId) {
  let credential = null;
  if (credentialId) {
    credential = await deps.storage.get(credentialId);
    if (credential) {
      contractId = credential.contractId;
    }
  }
  if (!contractId && credentialId) {
    const credentialIdBuffer = import_base64url6.default.toBuffer(credentialId);
    contractId = deriveContractAddress(credentialIdBuffer, deps.deployerKeypair.publicKey(), deps.networkPassphrase);
  }
  if (!contractId) {
    throw new Error("Could not determine contract ID");
  }
  if (!credentialId) {
    throw new Error("Could not determine credential ID");
  }
  try {
    await deps.rpc.getContractData(contractId, xdr6.ScVal.scvLedgerKeyContractInstance());
  } catch {
    if (credential && credential.deploymentStatus !== "failed") {
      await deps.storage.update(credentialId, {
        deploymentStatus: "pending"
      });
    }
    throw new Error(`Smart account contract not found on-chain for credential ${credentialId}. The wallet may not have been deployed yet.`);
  }
  if (credential) {
    await deps.storage.delete(credentialId);
  }
  deps.setConnectedState(contractId, credentialId);
  deps.events.emit("walletConnected", { contractId, credentialId });
  const now = Date.now();
  await deps.storage.saveSession({
    contractId,
    credentialId,
    connectedAt: now,
    expiresAt: now + deps.sessionExpiryMs
  });
  return {
    credentialId,
    contractId,
    credential: credential ?? void 0
  };
}
async function disconnect(deps) {
  const contractId = deps.getContractId();
  deps.clearConnectedState();
  await deps.storage.clearSession();
  if (contractId) {
    deps.events.emit("walletDisconnected", { contractId });
  }
}

// node_modules/smart-account-kit/dist/kit/deploy-ops.js
import { hash as hash6 } from "@stellar/stellar-sdk";

// node_modules/smart-account-kit/dist/kit/tx-ops.js
import { rpc as rpc2 } from "@stellar/stellar-sdk";
import { Address as Address4, Keypair as Keypair2, Operation as Operation2, TransactionBuilder as TransactionBuilder2, hash as hash5, xdr as xdr7 } from "@stellar/stellar-sdk";
function getSubmissionMethod(relayer, options) {
  if (options?.forceMethod) {
    return options.forceMethod;
  }
  if (relayer) {
    return "relayer";
  }
  return "rpc";
}
function shouldUseFeeSponsoring(relayer, options) {
  return getSubmissionMethod(relayer, options) === "relayer";
}
async function sendAndPoll(deps, transaction, options) {
  const method = getSubmissionMethod(deps.relayer, options);
  let hash9;
  switch (method) {
    case "relayer": {
      if (!deps.relayer) {
        return {
          success: false,
          hash: "",
          error: "Relayer is not configured"
        };
      }
      const operations = transaction.operations;
      if (operations.length !== 1) {
        return {
          success: false,
          hash: "",
          error: "Relayer requires exactly one invokeHostFunction operation"
        };
      }
      const op = operations[0];
      if (op.type !== "invokeHostFunction") {
        return {
          success: false,
          hash: "",
          error: "Relayer only supports invokeHostFunction operations"
        };
      }
      const invokeOp = op;
      const funcXdr = invokeOp.func.toXDR("base64");
      const authXdrs = (invokeOp.auth ?? []).map((entry) => entry.toXDR("base64"));
      const relayerResult = await deps.relayer.send(funcXdr, authXdrs);
      if (!relayerResult.success) {
        return {
          success: false,
          hash: "",
          error: relayerResult.error ?? "Relayer submission failed"
        };
      }
      hash9 = relayerResult.hash ?? "";
      break;
    }
    case "rpc":
    default: {
      const sendResult = await deps.rpc.sendTransaction(transaction);
      if (sendResult.status === "ERROR") {
        return {
          success: false,
          hash: sendResult.hash,
          error: sendResult.errorResult?.toXDR("base64") ?? "Transaction submission failed"
        };
      }
      hash9 = sendResult.hash;
      break;
    }
  }
  const txResult = await deps.rpc.pollTransaction(hash9, {
    attempts: 10
  });
  if (txResult.status === "SUCCESS") {
    return {
      success: true,
      hash: hash9,
      ledger: txResult.ledger
    };
  }
  if (txResult.status === "FAILED") {
    return {
      success: false,
      hash: hash9,
      error: "Transaction failed on-chain"
    };
  }
  return {
    success: false,
    hash: hash9,
    error: "Transaction confirmation timed out"
  };
}
function hasSourceAccountAuth(transaction) {
  for (const op of transaction.operations) {
    if (op.type !== "invokeHostFunction")
      continue;
    const invokeOp = op;
    if (!invokeOp.auth)
      continue;
    for (const entry of invokeOp.auth) {
      if (entry.credentials().switch().name === "sorobanCredentialsSourceAccount") {
        return true;
      }
    }
  }
  return false;
}
async function simulateHostFunction(deps, hostFunc) {
  let sourceAccount;
  try {
    sourceAccount = await deps.rpc.getAccount(deps.deployerKeypair.publicKey());
  } catch (error) {
    throw new Error(`Simulation requires the deployer account to exist on-chain. Fund ${deps.deployerKeypair.publicKey()} before simulating transactions.`);
  }
  const simulationTx = new TransactionBuilder2(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: deps.networkPassphrase
  }).addOperation(Operation2.invokeHostFunction({
    func: hostFunc,
    auth: []
  })).setTimeout(deps.timeoutInSeconds).build();
  const simResult = await deps.rpc.simulateTransaction(simulationTx);
  if ("error" in simResult) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }
  return {
    authEntries: simResult.result?.auth || []
  };
}
async function signResimulateAndPrepare(deps, hostFunc, authEntries, options) {
  const signedAuthEntries = [];
  for (const authEntry of authEntries) {
    const signedEntry = await deps.signAuthEntry(authEntry, {
      credentialId: options?.credentialId,
      expiration: options?.expiration
    });
    signedAuthEntries.push(signedEntry);
  }
  let sourceAccount;
  try {
    sourceAccount = await deps.rpc.getAccount(deps.deployerKeypair.publicKey());
  } catch (error) {
    throw new Error(`Re-simulation requires the deployer account to exist on-chain. Fund ${deps.deployerKeypair.publicKey()} before re-simulating transactions.`);
  }
  const resimTx = new TransactionBuilder2(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: deps.networkPassphrase
  }).addOperation(Operation2.invokeHostFunction({
    func: hostFunc,
    auth: signedAuthEntries
  })).setTimeout(deps.timeoutInSeconds).build();
  const resimResult = await deps.rpc.simulateTransaction(resimTx);
  if ("error" in resimResult) {
    throw new Error(`Re-simulation failed: ${resimResult.error}`);
  }
  const resimTxXdr = resimTx.toXDR();
  const normalizedTx = TransactionBuilder2.fromXDR(resimTxXdr, deps.networkPassphrase);
  const assembled = rpc2.assembleTransaction(normalizedTx, resimResult);
  return assembled.build();
}
async function sign(deps, transaction, options) {
  const contractId = deps.getContractId();
  if (!contractId) {
    throw new Error("Not connected to a wallet. Call connectWallet() first.");
  }
  const credentialId = options?.credentialId ?? deps.getCredentialId();
  const expiration = options?.expiration ?? await deps.calculateExpiration();
  await transaction.signAuthEntries({
    address: contractId,
    authorizeEntry: async (entry) => {
      const clone = xdr7.SorobanAuthorizationEntry.fromXDR(entry.toXDR());
      return deps.signAuthEntry(clone, { credentialId, expiration });
    }
  });
  return transaction;
}
async function signAndSubmit(deps, transaction, options) {
  if (!deps.getContractId()) {
    return { success: false, hash: "", error: "Not connected to a wallet. Call connectWallet() first." };
  }
  try {
    const builtTx = transaction.built;
    if (!builtTx) {
      return { success: false, hash: "", error: "Transaction has no built transaction" };
    }
    const operations = builtTx.operations;
    if (operations.length !== 1) {
      return { success: false, hash: "", error: "Expected exactly one operation" };
    }
    const operation = operations[0];
    if (operation.type !== "invokeHostFunction") {
      return { success: false, hash: "", error: "Expected invokeHostFunction operation" };
    }
    const invokeOp = operation;
    const simData = transaction.simulationData;
    if (!simData?.result?.auth) {
      return { success: false, hash: "", error: "No simulation data or auth entries" };
    }
    const preparedTx = await deps.signResimulateAndPrepare(invokeOp.func, simData.result.auth, { credentialId: options?.credentialId, expiration: options?.expiration });
    const submissionOpts = { forceMethod: options?.forceMethod };
    if (!deps.shouldUseFeeSponsoring(submissionOpts) || deps.hasSourceAccountAuth(preparedTx)) {
      preparedTx.sign(deps.deployerKeypair);
    }
    return deps.sendAndPoll(preparedTx, submissionOpts);
  } catch (err) {
    return {
      success: false,
      hash: "",
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}
async function fundWallet(deps, nativeTokenContract, options) {
  const contractId = deps.getContractId();
  if (!contractId) {
    return { success: false, hash: "", error: "Not connected to a wallet" };
  }
  if (!deps.networkPassphrase.includes("Test")) {
    return {
      success: false,
      hash: "",
      error: "fundWallet() only works on testnet"
    };
  }
  try {
    const tempKeypair = Keypair2.random();
    const friendbotResponse = await fetch(`${FRIENDBOT_URL}?addr=${tempKeypair.publicKey()}`);
    if (!friendbotResponse.ok) {
      const text = await friendbotResponse.text();
      return { success: false, hash: "", error: `Friendbot error: ${text}` };
    }
    const RESERVE_XLM = FRIENDBOT_RESERVE_XLM;
    let sourceAccount = await deps.rpc.getAccount(tempKeypair.publicKey());
    const tokenAddress = Address4.fromString(nativeTokenContract);
    const fromAddress = Address4.fromString(tempKeypair.publicKey());
    const balanceKey = xdr7.ScVal.scvVec([
      xdr7.ScVal.scvSymbol("Balance"),
      xdr7.ScVal.scvAddress(fromAddress.toScAddress())
    ]);
    let balanceXlm;
    try {
      const balanceData = await deps.rpc.getContractData(nativeTokenContract, balanceKey);
      const val = balanceData.val.contractData().val();
      if (val.switch().name === "scvI128") {
        const i128 = val.i128();
        const lo = BigInt(i128.lo().toString());
        const hi = BigInt(i128.hi().toString());
        const balanceStroops = hi << BigInt(64) | lo;
        balanceXlm = stroopsToXlm(balanceStroops);
      } else {
        balanceXlm = 1e4;
      }
    } catch (error) {
      console.warn("[SmartAccountKit] Failed to fetch temp account balance, using default:", error);
      balanceXlm = 1e4;
    }
    const transferAmount = balanceXlm - RESERVE_XLM;
    if (transferAmount <= 0) {
      return { success: false, hash: "", error: "Insufficient balance after reserve" };
    }
    const amountInStroops = xlmToStroops(transferAmount);
    const toAddress = Address4.fromString(contractId);
    const transferOp = Operation2.invokeHostFunction({
      func: xdr7.HostFunction.hostFunctionTypeInvokeContract(new xdr7.InvokeContractArgs({
        contractAddress: tokenAddress.toScAddress(),
        functionName: "transfer",
        args: [
          xdr7.ScVal.scvAddress(fromAddress.toScAddress()),
          xdr7.ScVal.scvAddress(toAddress.toScAddress()),
          xdr7.ScVal.scvI128(new xdr7.Int128Parts({
            lo: xdr7.Uint64.fromString((amountInStroops & BigInt("0xFFFFFFFFFFFFFFFF")).toString()),
            hi: xdr7.Int64.fromString((amountInStroops >> BigInt(64)).toString())
          }))
        ]
      })),
      auth: []
    });
    const simulationTx = new TransactionBuilder2(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: deps.networkPassphrase
    }).addOperation(transferOp).setTimeout(30).build();
    const simResult = await deps.rpc.simulateTransaction(simulationTx);
    if ("error" in simResult) {
      return { success: false, hash: "", error: `Simulation failed: ${simResult.error}` };
    }
    const authEntries = simResult.result?.auth || [];
    const signedAuthEntries = [];
    const currentLedger = simResult.latestLedger;
    const expirationLedger = currentLedger + LEDGERS_PER_HOUR;
    for (const entry of authEntries) {
      const credType = entry.credentials().switch().name;
      if (credType === "sorobanCredentialsSourceAccount") {
        const nonce = xdr7.Int64.fromString(Date.now().toString());
        const preimage = xdr7.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr7.HashIdPreimageSorobanAuthorization({
          networkId: hash5(Buffer.from(deps.networkPassphrase)),
          nonce,
          signatureExpirationLedger: expirationLedger,
          invocation: entry.rootInvocation()
        }));
        const payload = hash5(preimage.toXDR());
        const signature = tempKeypair.sign(payload);
        const sigEntry = new xdr7.ScMapEntry({
          key: xdr7.ScVal.scvSymbol("public_key"),
          val: xdr7.ScVal.scvBytes(tempKeypair.rawPublicKey())
        });
        const sigEntrySignature = new xdr7.ScMapEntry({
          key: xdr7.ScVal.scvSymbol("signature"),
          val: xdr7.ScVal.scvBytes(signature)
        });
        const addressEntry = new xdr7.SorobanAuthorizationEntry({
          credentials: xdr7.SorobanCredentials.sorobanCredentialsAddress(new xdr7.SorobanAddressCredentials({
            address: Address4.fromString(tempKeypair.publicKey()).toScAddress(),
            nonce,
            signatureExpirationLedger: expirationLedger,
            signature: xdr7.ScVal.scvVec([xdr7.ScVal.scvMap([sigEntry, sigEntrySignature])])
          })),
          rootInvocation: entry.rootInvocation()
        });
        signedAuthEntries.push(addressEntry);
        continue;
      }
      if (credType === "sorobanCredentialsAddress") {
        const credentials = entry.credentials().address();
        credentials.signatureExpirationLedger(expirationLedger);
        const preimage = xdr7.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr7.HashIdPreimageSorobanAuthorization({
          networkId: hash5(Buffer.from(deps.networkPassphrase)),
          nonce: credentials.nonce(),
          signatureExpirationLedger: credentials.signatureExpirationLedger(),
          invocation: entry.rootInvocation()
        }));
        const payload = hash5(preimage.toXDR());
        const signature = tempKeypair.sign(payload);
        const sigEntry = new xdr7.ScMapEntry({
          key: xdr7.ScVal.scvSymbol("public_key"),
          val: xdr7.ScVal.scvBytes(tempKeypair.rawPublicKey())
        });
        const sigEntrySignature = new xdr7.ScMapEntry({
          key: xdr7.ScVal.scvSymbol("signature"),
          val: xdr7.ScVal.scvBytes(signature)
        });
        credentials.signature(xdr7.ScVal.scvVec([xdr7.ScVal.scvMap([sigEntry, sigEntrySignature])]));
        signedAuthEntries.push(entry);
        continue;
      }
      signedAuthEntries.push(entry);
    }
    sourceAccount = await deps.rpc.getAccount(tempKeypair.publicKey());
    const invokeHostFn = simulationTx.operations[0];
    const txWithAuth = new TransactionBuilder2(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: deps.networkPassphrase
    }).addOperation(Operation2.invokeHostFunction({
      func: invokeHostFn.func,
      auth: signedAuthEntries
    })).setTimeout(30).build();
    const txWithAuthXdr = txWithAuth.toXDR();
    const normalizedTxWithAuth = TransactionBuilder2.fromXDR(txWithAuthXdr, deps.networkPassphrase);
    const preparedTx = rpc2.assembleTransaction(normalizedTxWithAuth, simResult).build();
    const submissionOpts = { forceMethod: options?.forceMethod };
    if (!deps.shouldUseFeeSponsoring(submissionOpts) || deps.hasSourceAccountAuth(preparedTx)) {
      preparedTx.sign(tempKeypair);
    }
    const txResult = await deps.sendAndPoll(preparedTx, submissionOpts);
    return {
      ...txResult,
      amount: txResult.success ? transferAmount : void 0
    };
  } catch (err) {
    return {
      success: false,
      hash: "",
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}
async function transfer(deps, tokenContract, recipient, amount, options) {
  const contractId = deps.getContractId();
  if (!contractId) {
    return { success: false, hash: "", error: "Not connected to a wallet" };
  }
  try {
    validateAddress(tokenContract, "tokenContract");
    validateAddress(recipient, "recipient");
    validateAmount(amount, "amount");
  } catch (err) {
    return {
      success: false,
      hash: "",
      error: err instanceof Error ? err.message : "Validation failed"
    };
  }
  if (recipient === contractId) {
    return {
      success: false,
      hash: "",
      error: "Cannot transfer to self"
    };
  }
  try {
    const amountInStroops = xlmToStroops(amount);
    const tokenAddress = Address4.fromString(tokenContract);
    const fromAddress = Address4.fromString(contractId);
    const toAddress = Address4.fromString(recipient);
    const hostFunc = xdr7.HostFunction.hostFunctionTypeInvokeContract(new xdr7.InvokeContractArgs({
      contractAddress: tokenAddress.toScAddress(),
      functionName: "transfer",
      args: [
        xdr7.ScVal.scvAddress(fromAddress.toScAddress()),
        xdr7.ScVal.scvAddress(toAddress.toScAddress()),
        xdr7.ScVal.scvI128(new xdr7.Int128Parts({
          lo: xdr7.Uint64.fromString((amountInStroops & BigInt("0xFFFFFFFFFFFFFFFF")).toString()),
          hi: xdr7.Int64.fromString((amountInStroops >> BigInt(64)).toString())
        }))
      ]
    }));
    const { authEntries } = await simulateHostFunction({
      rpc: deps.rpc,
      networkPassphrase: deps.networkPassphrase,
      timeoutInSeconds: deps.timeoutInSeconds,
      deployerKeypair: deps.deployerKeypair
    }, hostFunc);
    const preparedTx = await deps.signResimulateAndPrepare(hostFunc, authEntries, { credentialId: options?.credentialId });
    const submissionOpts = { forceMethod: options?.forceMethod };
    if (!deps.shouldUseFeeSponsoring(submissionOpts) || deps.hasSourceAccountAuth(preparedTx)) {
      preparedTx.sign(deps.deployerKeypair);
    }
    return deps.sendAndPoll(preparedTx, submissionOpts);
  } catch (err) {
    return {
      success: false,
      hash: "",
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}

// node_modules/smart-account-kit/dist/kit/deploy-ops.js
async function submitDeploymentTx(deps, tx, credentialId, options) {
  try {
    let hashValue;
    let ledger;
    const method = getSubmissionMethod(deps.relayer, options);
    if (method === "relayer" && tx.signed && deps.relayer) {
      const relayerResult = await deps.relayer.sendXdr(tx.signed);
      if (!relayerResult.success) {
        throw new Error(relayerResult.error ?? "Relayer submission failed");
      }
      hashValue = relayerResult.hash ?? "";
      const txResult = await deps.rpc.pollTransaction(hashValue, { attempts: 10 });
      if (txResult.status === "SUCCESS") {
        ledger = txResult.ledger;
      } else if (txResult.status === "FAILED") {
        throw new Error("Transaction failed on-chain");
      }
    } else {
      const sentTx = await tx.send();
      const txResponse = sentTx.getTransactionResponse;
      hashValue = sentTx.sendTransactionResponse?.hash ?? "";
      ledger = txResponse?.status === "SUCCESS" ? txResponse.ledger : void 0;
    }
    await deps.storage.delete(credentialId);
    return {
      success: true,
      hash: hashValue,
      ledger
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Transaction failed";
    await deps.storage.update(credentialId, {
      deploymentStatus: "failed",
      deploymentError: error
    });
    return {
      success: false,
      hash: "",
      error
    };
  }
}
async function buildDeployTransaction(deps, credentialId, publicKey) {
  const keyData = buildKeyData(publicKey, credentialId);
  const signer = {
    tag: "External",
    values: [
      deps.webauthnVerifierAddress,
      keyData
    ]
  };
  return Client.deploy({
    signers: [signer],
    policies: /* @__PURE__ */ new Map()
  }, {
    networkPassphrase: deps.networkPassphrase,
    rpcUrl: deps.rpcUrl,
    wasmHash: deps.accountWasmHash,
    publicKey: deps.deployerKeypair.publicKey(),
    salt: hash6(credentialId),
    timeoutInSeconds: deps.timeoutInSeconds
  });
}

// node_modules/smart-account-kit/dist/kit/multi-signer-ops.js
import { rpc as rpc3 } from "@stellar/stellar-sdk";
import { Address as Address5, Operation as Operation3, TransactionBuilder as TransactionBuilder3, hash as hash7, xdr as xdr8 } from "@stellar/stellar-sdk";
async function multiSignersTransfer(deps, tokenContract, recipient, amount, selectedSigners2, options) {
  const onLog = options?.onLog ?? (() => {
  });
  const contractId = deps.getContractId();
  if (!contractId) {
    return { success: false, hash: "", error: "Not connected to a wallet" };
  }
  const passkeySigners = selectedSigners2.filter((s) => s.type === "passkey");
  const walletSigners = selectedSigners2.filter((s) => s.type === "wallet");
  onLog(`Signing with ${passkeySigners.length} passkey(s) and ${walletSigners.length} wallet(s)`);
  for (const walletSigner of walletSigners) {
    if (!walletSigner.walletAddress)
      continue;
    if (!deps.externalSigners.canSignFor(walletSigner.walletAddress)) {
      return {
        success: false,
        hash: "",
        error: `No signer available for address: ${walletSigner.walletAddress}. Use kit.externalSigners.addFromSecret() or kit.externalSigners.addFromWallet() to add a signer.`
      };
    }
  }
  try {
    const amountInStroops = BigInt(Math.round(amount * STROOPS_PER_XLM));
    const tokenAddress = Address5.fromString(tokenContract);
    const fromAddress = Address5.fromString(contractId);
    const toAddress = Address5.fromString(recipient);
    const hostFunc = xdr8.HostFunction.hostFunctionTypeInvokeContract(new xdr8.InvokeContractArgs({
      contractAddress: tokenAddress.toScAddress(),
      functionName: "transfer",
      args: [
        xdr8.ScVal.scvAddress(fromAddress.toScAddress()),
        xdr8.ScVal.scvAddress(toAddress.toScAddress()),
        xdr8.ScVal.scvI128(new xdr8.Int128Parts({
          lo: xdr8.Uint64.fromString((amountInStroops & BigInt("0xFFFFFFFFFFFFFFFF")).toString()),
          hi: xdr8.Int64.fromString((amountInStroops >> BigInt(64)).toString())
        }))
      ]
    }));
    onLog("Simulating transaction...");
    const sourceAccount = await deps.rpc.getAccount(deps.deployerPublicKey);
    const simulationTx = new TransactionBuilder3(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: deps.networkPassphrase
    }).addOperation(Operation3.invokeHostFunction({
      func: hostFunc,
      auth: []
    })).setTimeout(deps.timeoutInSeconds).build();
    const simResult = await deps.rpc.simulateTransaction(simulationTx);
    if ("error" in simResult) {
      return { success: false, hash: "", error: `Simulation failed: ${simResult.error}` };
    }
    const authEntries = simResult.result?.auth || [];
    onLog(`Found ${authEntries.length} auth entries to sign`);
    const signedAuthEntries = [];
    const { sequence } = await deps.rpc.getLatestLedger();
    const expiration = sequence + AUTH_ENTRY_EXPIRATION_BUFFER;
    for (const entry of authEntries) {
      const credentials = entry.credentials();
      if (credentials.switch().name !== "sorobanCredentialsAddress") {
        signedAuthEntries.push(entry);
        continue;
      }
      const addressCreds = credentials.address();
      const authAddress = Address5.fromScAddress(addressCreds.address()).toString();
      if (authAddress === contractId) {
        let signedEntry = xdr8.SorobanAuthorizationEntry.fromXDR(entry.toXDR());
        signedEntry.credentials().address().signatureExpirationLedger(expiration);
        for (let i = 0; i < passkeySigners.length; i++) {
          const passkeySigner = passkeySigners[i];
          onLog(`Signing smart account auth entry with passkey ${i + 1}/${passkeySigners.length}...`);
          const credentialId = passkeySigner?.credentialId;
          signedEntry = await deps.signAuthEntry(signedEntry, { credentialId, expiration });
        }
        for (const walletSigner of walletSigners) {
          if (!walletSigner.walletAddress)
            continue;
          const delegatedSignerKey = xdr8.ScVal.scvVec([
            xdr8.ScVal.scvSymbol("Delegated"),
            xdr8.ScVal.scvAddress(Address5.fromString(walletSigner.walletAddress).toScAddress())
          ]);
          const ourSig = signedEntry.credentials().address().signature();
          const emptyBytes = xdr8.ScVal.scvBytes(Buffer.alloc(0));
          if (ourSig.switch().name === "scvVoid") {
            signedEntry.credentials().address().signature(xdr8.ScVal.scvVec([
              xdr8.ScVal.scvMap([
                new xdr8.ScMapEntry({ key: delegatedSignerKey, val: emptyBytes })
              ])
            ]));
          } else {
            const sigMap = ourSig.vec()?.[0].map();
            if (sigMap) {
              sigMap.push(new xdr8.ScMapEntry({ key: delegatedSignerKey, val: emptyBytes }));
              sigMap.sort((a, b) => a.key().toXDR("hex").localeCompare(b.key().toXDR("hex")));
            }
          }
        }
        signedAuthEntries.push(signedEntry);
        const smartAccountPreimage = xdr8.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr8.HashIdPreimageSorobanAuthorization({
          networkId: hash7(Buffer.from(deps.networkPassphrase)),
          nonce: signedEntry.credentials().address().nonce(),
          signatureExpirationLedger: expiration,
          invocation: signedEntry.rootInvocation()
        }));
        const signaturePayload = hash7(smartAccountPreimage.toXDR());
        for (const walletSigner of walletSigners) {
          if (!walletSigner.walletAddress)
            continue;
          onLog(`Getting delegated auth from ${walletSigner.walletAddress.slice(0, 8)}...`);
          const delegatedNonce = xdr8.Int64.fromString(Date.now().toString());
          const delegatedInvocation = new xdr8.SorobanAuthorizedInvocation({
            function: xdr8.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(new xdr8.InvokeContractArgs({
              contractAddress: Address5.fromString(contractId).toScAddress(),
              functionName: "__check_auth",
              args: [xdr8.ScVal.scvBytes(signaturePayload)]
            })),
            subInvocations: []
          });
          const delegatedPreimage = xdr8.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr8.HashIdPreimageSorobanAuthorization({
            networkId: hash7(Buffer.from(deps.networkPassphrase)),
            nonce: delegatedNonce,
            signatureExpirationLedger: expiration,
            invocation: delegatedInvocation
          }));
          const delegatedPreimageXdr = delegatedPreimage.toXDR("base64");
          const { signedAuthEntry: walletSignatureBase64 } = await deps.externalSigners.signAuthEntry(delegatedPreimageXdr, walletSigner.walletAddress);
          const signatureBytes = Buffer.from(walletSignatureBase64, "base64");
          const walletPublicKeyBytes = Address5.fromString(walletSigner.walletAddress).toScAddress().accountId().ed25519();
          const signatureScVal = xdr8.ScVal.scvVec([
            xdr8.ScVal.scvMap([
              new xdr8.ScMapEntry({
                key: xdr8.ScVal.scvSymbol("public_key"),
                val: xdr8.ScVal.scvBytes(walletPublicKeyBytes)
              }),
              new xdr8.ScMapEntry({
                key: xdr8.ScVal.scvSymbol("signature"),
                val: xdr8.ScVal.scvBytes(signatureBytes)
              })
            ])
          ]);
          const walletSignedEntry = new xdr8.SorobanAuthorizationEntry({
            credentials: xdr8.SorobanCredentials.sorobanCredentialsAddress(new xdr8.SorobanAddressCredentials({
              address: Address5.fromString(walletSigner.walletAddress).toScAddress(),
              nonce: delegatedNonce,
              signatureExpirationLedger: expiration,
              signature: signatureScVal
            })),
            rootInvocation: delegatedInvocation
          });
          signedAuthEntries.push(walletSignedEntry);
        }
      } else {
        const walletSigner = walletSigners.find((s) => s.walletAddress === authAddress);
        if (walletSigner && deps.externalSigners.canSignFor(authAddress)) {
          onLog(`Signing separate auth entry for ${authAddress.slice(0, 8)}...`);
          const entryClone = xdr8.SorobanAuthorizationEntry.fromXDR(entry.toXDR());
          entryClone.credentials().address().signatureExpirationLedger(expiration);
          const preimage = xdr8.HashIdPreimage.envelopeTypeSorobanAuthorization(new xdr8.HashIdPreimageSorobanAuthorization({
            networkId: hash7(Buffer.from(deps.networkPassphrase)),
            nonce: entryClone.credentials().address().nonce(),
            signatureExpirationLedger: expiration,
            invocation: entryClone.rootInvocation()
          }));
          const preimageXdr = preimage.toXDR("base64");
          const { signedAuthEntry: signatureBase64 } = await deps.externalSigners.signAuthEntry(preimageXdr, authAddress);
          const signatureBytes = Buffer.from(signatureBase64, "base64");
          const publicKeyBytes = Address5.fromString(authAddress).toScAddress().accountId().ed25519();
          const signatureScVal = xdr8.ScVal.scvVec([
            xdr8.ScVal.scvMap([
              new xdr8.ScMapEntry({
                key: xdr8.ScVal.scvSymbol("public_key"),
                val: xdr8.ScVal.scvBytes(publicKeyBytes)
              }),
              new xdr8.ScMapEntry({
                key: xdr8.ScVal.scvSymbol("signature"),
                val: xdr8.ScVal.scvBytes(signatureBytes)
              })
            ])
          ]);
          entryClone.credentials().address().signature(signatureScVal);
          signedAuthEntries.push(entryClone);
        } else {
          onLog(`Warning: Unknown auth entry for ${authAddress}`, "error");
          signedAuthEntries.push(entry);
        }
      }
    }
    onLog("Re-simulating with signatures...");
    const freshSourceAccount = await deps.rpc.getAccount(deps.deployerPublicKey);
    const resimTx = new TransactionBuilder3(freshSourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: deps.networkPassphrase
    }).addOperation(Operation3.invokeHostFunction({
      func: hostFunc,
      auth: signedAuthEntries
    })).setTimeout(deps.timeoutInSeconds).build();
    const resimResult = await deps.rpc.simulateTransaction(resimTx);
    if ("error" in resimResult) {
      return { success: false, hash: "", error: `Re-simulation failed: ${resimResult.error}` };
    }
    const resimTxXdr = resimTx.toXDR();
    const normalizedTx = TransactionBuilder3.fromXDR(resimTxXdr, deps.networkPassphrase);
    const assembled = rpc3.assembleTransaction(normalizedTx, resimResult);
    const preparedTx = assembled.build();
    const submissionOpts = { forceMethod: options?.forceMethod };
    if (!deps.shouldUseFeeSponsoring(submissionOpts) || deps.hasSourceAccountAuth(preparedTx)) {
      preparedTx.sign(deps.deployerKeypair);
    }
    onLog("Submitting transaction...");
    return deps.sendAndPoll(preparedTx, submissionOpts);
  } catch (err) {
    return {
      success: false,
      hash: "",
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}

// node_modules/smart-account-kit/dist/kit/policies-ops.js
import { Address as Address6, xdr as xdr9 } from "@stellar/stellar-sdk";
function convertPolicyParams(wallet, policyType, params) {
  if (!wallet) {
    return params;
  }
  const udtNames = {
    threshold: "SimpleThresholdAccountParams",
    spending_limit: "SpendingLimitAccountParams",
    weighted_threshold: "WeightedThresholdAccountParams"
  };
  const udtName = udtNames[policyType];
  if (!udtName) {
    return params;
  }
  try {
    const udtType = xdr9.ScSpecTypeDef.scSpecTypeUdt(new xdr9.ScSpecTypeUdt({ name: udtName }));
    const walletObj = wallet;
    const spec = walletObj.spec;
    if (spec && typeof spec.nativeToScVal === "function") {
      const scVal = spec.nativeToScVal(params, udtType);
      if (scVal.switch().name === "scvMap" && scVal.map()) {
        scVal.map()?.sort((a, b) => {
          const aKey = a.key().switch().name === "scvSymbol" ? a.key().sym().toString() : a.key().toXDR("hex");
          const bKey = b.key().switch().name === "scvSymbol" ? b.key().sym().toString() : b.key().toXDR("hex");
          return aKey.localeCompare(bKey);
        });
      }
      return scVal;
    }
    return params;
  } catch (error) {
    console.warn("[SmartAccountKit] Failed to convert policy params to ScVal:", error);
    return params;
  }
}
function buildPoliciesScVal(wallet, policies, policyTypes) {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }
  const entries = [];
  for (const [address, params] of policies) {
    const scAddress = new Address6(address).toScVal();
    const policyType = policyTypes.get(address);
    let scParams;
    if (policyType && policyType !== "custom") {
      const converted = convertPolicyParams(wallet, policyType, params);
      scParams = converted instanceof xdr9.ScVal ? converted : xdr9.ScVal.scvVoid();
    } else {
      const walletObj = wallet;
      const spec = walletObj.spec;
      if (spec && typeof spec.nativeToScVal === "function") {
        try {
          scParams = spec.nativeToScVal(params, xdr9.ScSpecTypeDef.scSpecTypeVal());
        } catch {
          scParams = xdr9.ScVal.scvVoid();
        }
      } else {
        scParams = xdr9.ScVal.scvVoid();
      }
    }
    entries.push(new xdr9.ScMapEntry({
      key: scAddress,
      val: scParams
    }));
  }
  entries.sort((a, b) => {
    const aXdr = a.key().toXDR("hex");
    const bXdr = b.key().toXDR("hex");
    return aXdr.localeCompare(bXdr);
  });
  return xdr9.ScVal.scvMap(entries);
}

// node_modules/smart-account-kit/dist/kit.js
var { Server: RpcServer } = rpc4;
var { AssembledTransaction } = contract2;
var SmartAccountKit = class {
  // Network configuration
  rpcUrl;
  networkPassphrase;
  rpc;
  // Contract configuration
  accountWasmHash;
  webauthnVerifierAddress;
  timeoutInSeconds;
  signatureExpirationLedgers;
  // WebAuthn configuration
  rpId;
  rpName;
  webAuthn;
  // Storage
  storage;
  // External wallet adapter (optional)
  externalWalletAdapter;
  // Session configuration
  sessionExpiryMs;
  // State
  _credentialId;
  _contractId;
  /** Smart account contract client (after connection) */
  wallet;
  // Deployer keypair (used as source account for contract deployment)
  deployerKeypair;
  // ==========================================================================
  // Sub-managers for organized access to contract methods
  // ==========================================================================
  /**
   * Signer management methods.
   * Add, remove, and manage signers on context rules.
   */
  signers;
  /**
   * Context rule management methods.
   * Create, read, update, and delete context rules.
   */
  rules;
  /**
   * Policy management methods.
   * Add and remove policies from context rules.
   */
  policies;
  /**
   * Credential storage management methods.
   * Manage locally stored credentials for pending deployments.
   */
  credentials;
  /**
   * Event emitter for credential lifecycle events.
   * Subscribe to events like walletConnected, credentialCreated, etc.
   *
   * @example
   * ```typescript
   * kit.events.on('walletConnected', ({ contractId }) => {
   *   console.log('Connected to wallet:', contractId);
   * });
   * ```
   */
  events;
  /**
   * Multi-signer operations.
   * Execute transactions that require multiple signers (passkeys + external wallets).
   *
   * @example
   * ```typescript
   * const selectedSigners = [
   *   { type: 'passkey', credentialId: 'abc123', label: 'My Passkey' },
   *   { type: 'wallet', walletAddress: 'G...', label: 'Freighter' },
   * ];
   * const result = await kit.multiSigners.transfer(
   *   tokenContract, recipient, amount, selectedSigners
   * );
   * ```
   */
  multiSigners;
  /**
   * External signer management.
   * Unified interface for managing G-address signers (Stellar accounts) for
   * multi-signature operations.
   *
   * Supports two methods of adding signers:
   * 1. Raw secret key (Keypair) - stored in memory only
   * 2. External wallet via StellarWalletsKit (if configured)
   *
   * @example
   * ```typescript
   * // Add from raw secret key (memory-only, lost on refresh)
   * const { address } = kit.externalSigners.addFromSecret("S...");
   *
   * // Add from external wallet (if SWK configured)
   * const wallet = await kit.externalSigners.addFromWallet();
   *
   * // List all external signers
   * const signers = kit.externalSigners.getAll();
   *
   * // Check if we can sign for an address
   * if (kit.externalSigners.canSignFor("G...")) {
   *   // SDK will automatically use this signer during multi-sig operations
   * }
   * ```
   */
  externalSigners;
  /**
   * Indexer client for discovering smart account contracts.
   *
   * The indexer enables reverse lookups from signer credentials to contracts,
   * which is essential for discovering which contracts a user has access to.
   *
   * This is automatically configured for known networks (testnet) if not
   * explicitly disabled via `indexerUrl: false` in the config.
   *
   * @example
   * ```typescript
   * // Check if indexer is available
   * if (kit.indexer) {
   *   // Discover contracts by credential ID
   *   const { contracts } = await kit.indexer.lookupByCredentialId(credentialId);
   *
   *   // Discover contracts by G-address
   *   const { contracts } = await kit.indexer.lookupByAddress('GABCD...');
   *
   *   // Get full contract details
   *   const details = await kit.indexer.getContractDetails('CABC...');
   * }
   * ```
   */
  indexer;
  /**
   * Optional Relayer client for fee-sponsored transaction submission.
   *
   * When configured, allows submitting transactions without paying fees -
   * the fees are sponsored by the Relayer proxy service.
   *
   * The Relayer uses channel accounts for parallel transaction submission with
   * automatic fee bumping, eliminating sequence number conflicts.
   *
   * @example
   * ```typescript
   * // Configure Relayer in the kit
   * const kit = new SmartAccountKit({
   *   // ... other config
   *   relayerUrl: 'https://my-relayer-proxy.example.com',
   * });
   *
   * // Submit a signed transaction via Relayer (fee-bump)
   * if (kit.relayer) {
   *   const result = await kit.relayer.sendXdr(signedTransaction);
   *   console.log('Hash:', result.hash);
   * }
   * ```
   */
  relayer;
  constructor(config) {
    if (!config.rpcUrl)
      throw new Error("rpcUrl is required");
    if (!config.networkPassphrase)
      throw new Error("networkPassphrase is required");
    if (!config.accountWasmHash)
      throw new Error("accountWasmHash is required");
    if (!config.webauthnVerifierAddress)
      throw new Error("webauthnVerifierAddress is required");
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase;
    this.rpc = new RpcServer(config.rpcUrl);
    this.accountWasmHash = config.accountWasmHash;
    this.webauthnVerifierAddress = config.webauthnVerifierAddress;
    this.timeoutInSeconds = config.timeoutInSeconds ?? 30;
    this.signatureExpirationLedgers = config.signatureExpirationLedgers ?? LEDGERS_PER_HOUR;
    this.rpId = config.rpId;
    this.rpName = config.rpName ?? "Smart Account";
    this.webAuthn = config.webAuthn ?? { startRegistration, startAuthentication };
    this.storage = config.storage ?? new MemoryStorage();
    this.externalWalletAdapter = config.externalWallet;
    this.sessionExpiryMs = config.sessionExpiryMs ?? DEFAULT_SESSION_EXPIRY_MS;
    if (config.indexerUrl === false) {
      this.indexer = null;
    } else if (typeof config.indexerUrl === "string") {
      this.indexer = new IndexerClient({ baseUrl: config.indexerUrl });
    } else {
      const defaultUrl = DEFAULT_INDEXER_URLS[this.networkPassphrase];
      this.indexer = defaultUrl ? new IndexerClient({ baseUrl: defaultUrl }) : null;
    }
    this.relayer = config.relayerUrl ? new RelayerClient(config.relayerUrl) : null;
    this.deployerKeypair = Keypair3.fromRawEd25519Seed(hash8(Buffer.from("openzeppelin-smart-account-kit")));
    this.events = new SmartAccountEventEmitter();
    const walletStorage = typeof localStorage !== "undefined" ? localStorage : void 0;
    this.externalSigners = new ExternalSignerManager(this.networkPassphrase, this.externalWalletAdapter, walletStorage);
    this.signers = new SignerManager({
      requireWallet: () => this.requireWallet(),
      storage: this.storage,
      events: this.events,
      webauthnVerifierAddress: this.webauthnVerifierAddress,
      createPasskey: (appName, userName) => this.createPasskey(appName, userName)
    });
    this.rules = new ContextRuleManager({
      requireWallet: () => this.requireWallet()
    });
    this.policies = new PolicyManager({
      requireWallet: () => this.requireWallet()
    });
    this.credentials = new CredentialManager({
      storage: this.storage,
      rpc: this.rpc,
      events: this.events,
      webauthnVerifierAddress: this.webauthnVerifierAddress,
      rpName: this.rpName,
      networkPassphrase: this.networkPassphrase,
      deployerKeypair: this.deployerKeypair,
      getContractId: () => this._contractId,
      setConnectedState: (contractId, credentialId) => {
        this._contractId = contractId;
        this._credentialId = credentialId;
      },
      initializeWallet: (contractId) => this.initializeWallet(contractId),
      createPasskey: (appName, userName) => this.createPasskey(appName, userName),
      buildDeployTransaction: (credentialIdBuffer, publicKey) => this.buildDeployTransaction(credentialIdBuffer, publicKey),
      signWithDeployer: (tx) => this.signWithDeployer(tx),
      submitDeploymentTx: (tx, credentialId, options) => this.submitDeploymentTx(tx, credentialId, options),
      deriveContractAddress: (credentialIdBuffer) => deriveContractAddress(credentialIdBuffer, this.deployerKeypair.publicKey(), this.networkPassphrase),
      shouldUseFeeSponsoring: (options) => this.shouldUseFeeSponsoring(options)
    });
    this.multiSigners = new MultiSignerManager({
      getContractId: () => this._contractId,
      isConnected: () => this.isConnected,
      getRules: (contextRuleType) => this.rules.getAll(contextRuleType),
      externalSigners: this.externalSigners,
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      deployerKeypair: this.deployerKeypair,
      deployerPublicKey: this.deployerPublicKey,
      signAuthEntry: (entry, options) => this.signAuthEntry(entry, options),
      sendAndPoll: (tx) => this.sendAndPoll(tx),
      hasSourceAccountAuth: (tx) => this.hasSourceAccountAuth(tx),
      executeTransfer: (tokenContract, recipient, amount, selectedSigners2, options) => this.multiSignersTransfer(tokenContract, recipient, amount, selectedSigners2, options),
      shouldUseFeeSponsoring: (options) => this.shouldUseFeeSponsoring(options)
    });
  }
  // ==========================================================================
  // Getters
  // ==========================================================================
  /** Currently connected credential ID (Base64URL encoded) */
  get credentialId() {
    return this._credentialId;
  }
  /** Currently connected contract ID */
  get contractId() {
    return this._contractId;
  }
  /** Check if connected to a wallet */
  get isConnected() {
    return !!this._contractId;
  }
  /**
   * Get the deployer public key (used as fee payer for transactions)
   *
   * This is a deterministic keypair derived from the network passphrase,
   * shared across all SDK instances on the same network.
   */
  get deployerPublicKey() {
    return this.deployerKeypair.publicKey();
  }
  // ==========================================================================
  // Contract Discovery (Indexer)
  // ==========================================================================
  /**
   * Discover smart account contracts associated with a credential ID.
   *
   * This uses the indexer to perform a reverse lookup from the credential ID
   * to find all contracts where this credential is registered as a signer.
   *
   * @param credentialId - The credential ID to look up (hex or base64url encoded)
   * @returns Array of contract summaries, or null if indexer is not available
   *
   * @example
   * ```typescript
   * // After WebAuthn authentication, find contracts for the credential
   * const contracts = await kit.discoverContractsByCredential(credentialId);
   * if (contracts && contracts.length > 0) {
   *   // User has access to these contracts
   *   console.log(`Found ${contracts.length} smart accounts`);
   * }
   * ```
   */
  async discoverContractsByCredential(credentialId) {
    return discoverContractsByCredential(this.indexer, credentialId);
  }
  /**
   * Discover smart account contracts associated with a Stellar address.
   *
   * This works for both G-addresses (Delegated signers) and C-addresses
   * (External signer verifier contracts).
   *
   * @param address - Stellar address (G... or C...)
   * @returns Array of contract summaries, or null if indexer is not available
   *
   * @example
   * ```typescript
   * // Find contracts where this G-address is a delegated signer
   * const contracts = await kit.discoverContractsByAddress('GABCD...');
   * ```
   */
  async discoverContractsByAddress(address) {
    return discoverContractsByAddress(this.indexer, address);
  }
  /**
   * Get detailed information about a smart account contract from the indexer.
   *
   * Returns the current state including active context rules, signers, and policies.
   * This is useful for displaying contract details without making on-chain calls.
   *
   * Note: For real-time data, use `kit.rules.getAll()` instead which queries on-chain.
   *
   * @param contractId - Smart account contract address (C...)
   * @returns Contract details or null if not found/indexer unavailable
   */
  async getContractDetailsFromIndexer(contractId) {
    return getContractDetailsFromIndexer(this.indexer, contractId);
  }
  // ==========================================================================
  // Private Helpers - Connection Guards
  // ==========================================================================
  /**
   * Require that a wallet is connected and return the wallet client and contract ID.
   * Throws if not connected.
   * @internal
   */
  requireWallet() {
    if (!this._contractId || !this.wallet) {
      throw new Error("Not connected to a wallet");
    }
    return { wallet: this.wallet, contractId: this._contractId };
  }
  /**
   * Initialize the wallet client for a contract.
   * @internal
   */
  initializeWallet(contractId) {
    this.wallet = new Client({
      contractId,
      networkPassphrase: this.networkPassphrase,
      rpcUrl: this.rpcUrl
    });
  }
  /**
   * Update connection state and initialize wallet client.
   * @internal
   */
  setConnectedState(contractId, credentialId) {
    this._contractId = contractId;
    this._credentialId = credentialId;
    this.initializeWallet(contractId);
  }
  /**
   * Clear connection state.
   * @internal
   */
  clearConnectedState() {
    this._contractId = void 0;
    this._credentialId = void 0;
    this.wallet = void 0;
  }
  /**
   * Sign an assembled transaction with the deployer keypair.
   * @internal
   */
  async signWithDeployer(tx) {
    await tx.sign({
      signTransaction: async (txXdr) => {
        const parsedTx = TransactionBuilder4.fromXDR(txXdr, this.networkPassphrase);
        parsedTx.sign(this.deployerKeypair);
        return {
          signedTxXdr: parsedTx.toXDR(),
          signerAddress: this.deployerKeypair.publicKey()
        };
      }
    });
  }
  /**
   * Calculate expiration ledger from current ledger.
   * @internal
   */
  async calculateExpiration() {
    const { sequence } = await this.rpc.getLatestLedger();
    return sequence + this.signatureExpirationLedgers;
  }
  /**
   * Submit a deployment transaction and update credential storage.
   * On success, deletes the credential from storage.
   * On failure, marks it as failed for retry.
   *
   * Deployment uses source_account auth (envelope signature). When using Relayer,
   * the signed XDR is submitted for fee-bumping. The inner tx signature is preserved.
   *
   * @internal
   */
  async submitDeploymentTx(tx, credentialId, options) {
    return submitDeploymentTx({ storage: this.storage, rpc: this.rpc, relayer: this.relayer }, tx, credentialId, options);
  }
  // ==========================================================================
  // Wallet Creation
  // ==========================================================================
  /**
   * Create a new smart wallet with a passkey as the primary signer
   *
   * @param appName - Application name (displayed to user during passkey creation)
   * @param userName - User identifier (displayed to user during passkey creation)
   * @param options - Additional options
   * @returns Wallet creation result with credential ID, contract ID, and signed transaction
   */
  async createWallet(appName, userName, options) {
    return createWallet({
      storage: this.storage,
      events: this.events,
      deployerKeypair: this.deployerKeypair,
      networkPassphrase: this.networkPassphrase,
      sessionExpiryMs: this.sessionExpiryMs,
      createPasskey: (name, user, selection) => this.createPasskey(name, user, selection),
      buildDeployTransaction: (credentialIdBuffer, publicKey) => this.buildDeployTransaction(credentialIdBuffer, publicKey),
      signWithDeployer: (tx) => this.signWithDeployer(tx),
      submitDeploymentTx: (tx, credentialId, submissionOptions) => this.submitDeploymentTx(tx, credentialId, submissionOptions),
      fundWallet: (nativeTokenContract, fundOptions) => this.fundWallet(nativeTokenContract, fundOptions),
      setConnectedState: (contractId, credentialId) => this.setConnectedState(contractId, credentialId)
    }, appName, userName, options);
  }
  /**
   * Create a passkey without deploying a wallet.
   * Used internally for wallet creation and adding passkey signers.
   *
   * @internal
   */
  async createPasskey(appName, userName, authenticatorSelection) {
    return createPasskey({
      rpId: this.rpId,
      rpName: this.rpName,
      webAuthn: this.webAuthn
    }, appName, userName, authenticatorSelection);
  }
  // ==========================================================================
  // Wallet Connection
  // ==========================================================================
  /**
   * Authenticate with a passkey without connecting to a specific contract.
   *
   * This is useful when you need to:
   * 1. Get the credential ID first
   * 2. Use the indexer to discover which contracts the passkey has access to
   * 3. Then connect to a specific contract using connectWallet({ contractId, credentialId })
   *
   * @returns The credential ID from the selected passkey
   *
   * @example
   * ```typescript
   * // Step 1: Authenticate to get credential ID
   * const { credentialId } = await kit.authenticatePasskey();
   *
   * // Step 2: Discover contracts via indexer
   * const contracts = await kit.discoverContractsByCredential(credentialId);
   *
   * // Step 3: Let user choose or connect to the first one
   * if (contracts && contracts.length > 0) {
   *   await kit.connectWallet({
   *     contractId: contracts[0].contract_id,
   *     credentialId
   *   });
   * }
   * ```
   */
  async authenticatePasskey() {
    return authenticatePasskey({
      rpId: this.rpId,
      rpName: this.rpName,
      webAuthn: this.webAuthn
    });
  }
  /**
   * Connect to an existing smart wallet
   *
   * Behavior based on options:
   * - No options: Silent restore from storage, returns null if no stored session
   * - `{ prompt: true }`: Try stored session first, prompt user if none
   * - `{ fresh: true }`: Ignore stored session, always prompt user
   * - `{ credentialId }`: Connect using specific credential ID
   * - `{ contractId }`: Connect using specific contract ID
   *
   * @param options - Connection options
   * @returns Connection result, or null if no session and not prompting
   *
   * @example
   * ```typescript
   * // Page load - silent restore
   * const result = await kit.connectWallet();
   * if (!result) showConnectButton();
   *
   * // User clicks "Connect Wallet"
   * await kit.connectWallet({ prompt: true });
   *
   * // User clicks "Switch Wallet"
   * await kit.connectWallet({ fresh: true });
   * ```
   */
  async connectWallet(options) {
    return connectWallet({
      storage: this.storage,
      events: this.events,
      rpId: this.rpId,
      webAuthn: this.webAuthn,
      connectWithCredentials: (credentialId, contractId) => this.connectWithCredentials(credentialId, contractId)
    }, options);
  }
  /**
   * Internal helper to connect with known credentials
   */
  async connectWithCredentials(credentialId, contractId) {
    return connectWithCredentials({
      storage: this.storage,
      rpc: this.rpc,
      deployerKeypair: this.deployerKeypair,
      networkPassphrase: this.networkPassphrase,
      sessionExpiryMs: this.sessionExpiryMs,
      events: this.events,
      setConnectedState: (nextContractId, nextCredentialId) => this.setConnectedState(nextContractId, nextCredentialId)
    }, credentialId, contractId);
  }
  /**
   * Disconnect from the current wallet and clear stored session
   */
  async disconnect() {
    return disconnect({
      storage: this.storage,
      events: this.events,
      clearConnectedState: () => this.clearConnectedState(),
      getContractId: () => this._contractId
    });
  }
  // ==========================================================================
  // Transaction Signing
  // ==========================================================================
  /**
   * Sign a transaction's auth entries with a passkey.
   *
   * **IMPORTANT**: This method only signs authorization entries. It does NOT
   * re-simulate the transaction. For WebAuthn signatures, you MUST re-simulate
   * before submission because WebAuthn signatures are much larger than the
   * placeholders used during initial simulation.
   *
   * For most use cases, prefer `signAndSubmit()` which handles the full flow:
   * sign → re-simulate → assemble → submit.
   *
   * @param transaction - AssembledTransaction to sign
   * @param options - Signing options
   * @returns The transaction with signed auth entries (NOT ready for direct submission)
   */
  async sign(transaction, options) {
    const signed = await sign({
      getContractId: () => this._contractId,
      getCredentialId: () => this._credentialId,
      calculateExpiration: () => this.calculateExpiration(),
      signAuthEntry: (entry, signOptions) => this.signAuthEntry(entry, signOptions)
    }, transaction, options);
    return signed;
  }
  /**
   * Sign and submit a transaction with proper re-simulation for WebAuthn.
   *
   * This is the recommended method for submitting transactions signed by the
   * smart account's passkey. It handles the full flow:
   * 1. Sign authorization entries with WebAuthn
   * 2. Re-simulate with signed entries (required for accurate resource costs)
   * 3. Assemble the transaction with correct fees
   * 4. Sign with fee payer and submit
   *
   * @param transaction - AssembledTransaction to sign and submit
   * @param options - Signing options
   * @returns Transaction result
   */
  async signAndSubmit(transaction, options) {
    return signAndSubmit({
      getContractId: () => this._contractId,
      signResimulateAndPrepare: (hostFunc, authEntries, signOptions) => this.signResimulateAndPrepare(hostFunc, authEntries, signOptions),
      shouldUseFeeSponsoring: (submissionOptions) => this.shouldUseFeeSponsoring(submissionOptions),
      hasSourceAccountAuth: (preparedTx) => this.hasSourceAccountAuth(preparedTx),
      sendAndPoll: (preparedTx, submissionOptions) => this.sendAndPoll(preparedTx, submissionOptions),
      deployerKeypair: this.deployerKeypair
    }, transaction, options);
  }
  /**
   * Sign a single authorization entry with a passkey.
   *
   * This is a low-level method useful for multi-signer flows.
   * For most use cases, prefer:
   * - `signAndSubmit()` for full sign + re-simulate + submit flow
   * - `sign()` to sign auth entries on an AssembledTransaction
   * - `multiSigners.operation()` for multi-signer operations
   *
   * @param entry - The authorization entry to sign
   * @param options - Signing options (credentialId, expiration)
   * @returns The signed authorization entry
   */
  async signAuthEntry(entry, options) {
    return signAuthEntry({
      rpId: this.rpId,
      rpName: this.rpName,
      webAuthn: this.webAuthn,
      networkPassphrase: this.networkPassphrase,
      storage: this.storage,
      webauthnVerifierAddress: this.webauthnVerifierAddress,
      calculateExpiration: () => this.calculateExpiration(),
      getCredentialId: () => this._credentialId,
      requireWallet: () => this.requireWallet()
    }, entry, options);
  }
  // ==========================================================================
  // Transaction Helpers
  // ==========================================================================
  /**
   * Fund a wallet on testnet using Friendbot
   *
   * Only works on Stellar testnet. Creates a temporary account, funds it
   * via Friendbot, then transfers XLM to the smart account contract.
   * This is necessary because Friendbot can't fund contract addresses directly.
   *
   * @param nativeTokenContract - Native XLM token SAC address (required for transfer)
   * @param options - Optional settings
   * @returns Whether the funding was successful, and the amount funded
   */
  async fundWallet(nativeTokenContract, options) {
    return fundWallet({
      getContractId: () => this._contractId,
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      shouldUseFeeSponsoring: (submissionOptions) => this.shouldUseFeeSponsoring(submissionOptions),
      hasSourceAccountAuth: (preparedTx) => this.hasSourceAccountAuth(preparedTx),
      sendAndPoll: (preparedTx, submissionOptions) => this.sendAndPoll(preparedTx, submissionOptions)
    }, nativeTokenContract, options);
  }
  /**
   * Transfer tokens from the smart wallet to a recipient
   *
   * This handles the full flow: build transaction, simulate, sign auth entries
   * with passkey, re-simulate for accurate resources, and submit.
   *
   * The deployer keypair is used as the fee payer (transaction source).
   *
   * @param tokenContract - Token contract address (SAC address for native assets)
   * @param recipient - Recipient address (G... or C...)
   * @param amount - Amount to transfer (in token units, e.g., 10 for 10 XLM)
   * @param options - Transfer options
   * @returns Transfer result
   */
  async transfer(tokenContract, recipient, amount, options) {
    return transfer({
      getContractId: () => this._contractId,
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      deployerKeypair: this.deployerKeypair,
      shouldUseFeeSponsoring: (submissionOptions) => this.shouldUseFeeSponsoring(submissionOptions),
      hasSourceAccountAuth: (preparedTx) => this.hasSourceAccountAuth(preparedTx),
      sendAndPoll: (preparedTx, submissionOptions) => this.sendAndPoll(preparedTx, submissionOptions),
      signResimulateAndPrepare: (hostFunc, authEntries, signOptions) => this.signResimulateAndPrepare(hostFunc, authEntries, signOptions)
    }, tokenContract, recipient, amount, options);
  }
  // ==========================================================================
  // Private Helpers
  // ==========================================================================
  /**
   * Check if a transaction has any auth entries using source_account credentials.
   *
   * When auth uses source_account credentials, the authorization comes from the
   * transaction envelope signature, so we MUST sign even when using fee sponsoring.
   * For Address credentials, the authorization is in the auth entry itself.
   *
   * @param transaction - The transaction to check
   * @returns true if any auth entry uses source_account credentials
   * @internal
   */
  hasSourceAccountAuth(transaction) {
    return hasSourceAccountAuth(transaction);
  }
  /**
   * Simulate a host function to get auth entries
   */
  async simulateHostFunction(hostFunc) {
    return simulateHostFunction({
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      deployerKeypair: this.deployerKeypair
    }, hostFunc);
  }
  /**
   * Sign auth entries with WebAuthn, re-simulate, and prepare transaction for submission.
   *
   * This is the core helper that handles the WebAuthn-specific flow:
   * 1. Sign each auth entry with the passkey
   * 2. Rebuild transaction with signed auth
   * 3. Re-simulate to get accurate resource costs (WebAuthn signatures are large)
   * 4. Assemble transaction with correct fees and soroban data
   *
   * @returns Prepared transaction ready for fee payer signature and submission
   */
  async signResimulateAndPrepare(hostFunc, authEntries, options) {
    return signResimulateAndPrepare({
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      deployerKeypair: this.deployerKeypair,
      signAuthEntry: (entry, signOptions) => this.signAuthEntry(entry, signOptions)
    }, hostFunc, authEntries, options);
  }
  /**
   * Determine which submission method to use based on configuration and options.
   *
   * Priority order (when not forced):
   * 1. Relayer (if configured)
   * 2. RPC (always available)
   *
   * @param options - Submission options
   * @returns The submission method to use
   */
  getSubmissionMethod(options) {
    return getSubmissionMethod(this.relayer, options);
  }
  /**
   * Check if fee sponsoring service (Relayer) should be used.
   * When using fee sponsoring, transactions are wrapped in a fee-bump, so the
   * envelope signature is generally not required (unless source_account auth is present).
   */
  shouldUseFeeSponsoring(options) {
    return shouldUseFeeSponsoring(this.relayer, options);
  }
  /**
   * Send a transaction and poll for confirmation.
   *
   * Uses the following priority for submission (unless overridden):
   * 1. Relayer (if configured) - submits func + auth entries
   * 2. RPC (direct submission) - submits full transaction XDR
   *
   * @param transaction - The transaction to submit
   * @param options - Submission options
   * @returns Transaction result with hash and status
   */
  async sendAndPoll(transaction, options) {
    return sendAndPoll({ rpc: this.rpc, relayer: this.relayer }, transaction, options);
  }
  /**
   * Build a deployment transaction for the smart account contract
   * Returns an AssembledTransaction that can be signed and sent
   */
  async buildDeployTransaction(credentialId, publicKey) {
    return buildDeployTransaction({
      accountWasmHash: this.accountWasmHash,
      webauthnVerifierAddress: this.webauthnVerifierAddress,
      networkPassphrase: this.networkPassphrase,
      rpcUrl: this.rpcUrl,
      deployerKeypair: this.deployerKeypair,
      timeoutInSeconds: this.timeoutInSeconds
    }, credentialId, publicKey);
  }
  // ==========================================================================
  // Multi-Signer Operations (private - access via kit.multiSigners.*)
  // ==========================================================================
  /**
   * Execute a transfer with multiple signers.
   * @internal Access via kit.multiSigners.transfer()
   */
  async multiSignersTransfer(tokenContract, recipient, amount, selectedSigners2, options) {
    return multiSignersTransfer({
      getContractId: () => this._contractId,
      externalSigners: this.externalSigners,
      rpc: this.rpc,
      networkPassphrase: this.networkPassphrase,
      timeoutInSeconds: this.timeoutInSeconds,
      deployerKeypair: this.deployerKeypair,
      deployerPublicKey: this.deployerPublicKey,
      signAuthEntry: (entry, signOptions) => this.signAuthEntry(entry, signOptions),
      shouldUseFeeSponsoring: (submissionOptions) => this.shouldUseFeeSponsoring(submissionOptions),
      hasSourceAccountAuth: (preparedTx) => this.hasSourceAccountAuth(preparedTx),
      sendAndPoll: (preparedTx, submissionOptions) => this.sendAndPoll(preparedTx, submissionOptions)
    }, tokenContract, recipient, amount, selectedSigners2, options);
  }
  // ==========================================================================
  // Utility Methods
  // ==========================================================================
  /**
   * Convert policy parameters to ScVal format for on-chain submission.
   *
   * When adding policies via `kit.policies.add()`, the install parameters need
   * to be in ScVal format. This method converts native JavaScript objects to
   * the proper ScVal format based on the policy type.
   *
   * @param policyType - The type of policy: "threshold", "spending_limit", or "weighted_threshold"
   * @param params - The policy parameters as a native JavaScript object
   * @returns The parameters converted to ScVal format, or the original params if conversion fails
   *
   * @example
   * ```typescript
   * // Convert threshold policy params
   * const thresholdParams = kit.convertPolicyParams("threshold", { threshold: 2 });
   *
   * // Convert spending limit params
   * const spendingParams = kit.convertPolicyParams("spending_limit", {
   *   token: "CDLZFC3...",
   *   limit: 1000000000n,
   *   period: 8640, // ~1 day in ledgers
   * });
   *
   * // Use with policies.add()
   * const tx = await kit.policies.add(ruleId, policyAddress, thresholdParams);
   * ```
   */
  convertPolicyParams(policyType, params) {
    return convertPolicyParams(this.wallet, policyType, params);
  }
  /**
   * Build a sorted policies Map as ScVal for on-chain submission.
   *
   * Soroban requires ScMap keys to be sorted. This method converts a JavaScript
   * Map of policy addresses to params into a properly sorted ScVal.
   *
   * @param policies - Map of policy addresses (C...) to their params
   * @param policyTypes - Map of policy addresses to their types (for conversion)
   * @returns ScVal representing the sorted policies map
   */
  buildPoliciesScVal(policies, policyTypes) {
    return buildPoliciesScVal(this.wallet, policies, policyTypes);
  }
};

// recovery-test.mts
import { Keypair as Keypair4 } from "@stellar/stellar-sdk";
var args = process.argv.slice(2);
var getArg = (n) => {
  const i = args.indexOf(`--${n}`);
  return i > -1 ? args[i + 1] : null;
};
var SECRET = getArg("secret");
var WALLET_ID = getArg("wallet");
var DESTINATION = getArg("destination");
var AMOUNT = parseFloat(getArg("amount") || "0");
var USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
if (!SECRET || !WALLET_ID || !DESTINATION || !AMOUNT) {
  console.log("Usage: node recovery-bundled.mjs --secret S... --wallet C... --destination G... --amount 1");
  process.exit(1);
}
var backupKeypair = Keypair4.fromSecret(SECRET);
console.log("");
console.log("\u{1F6A8} RADOX IS DOWN \u2014 Recovery mode (multiSigners path)");
console.log("");
console.log(`\u{1F511} Signer:      ${backupKeypair.publicKey()}`);
console.log(`\u{1F4E6} Wallet:      ${WALLET_ID}`);
console.log(`\u{1F4E4} To:          ${DESTINATION}`);
console.log(`\u{1F4B0} Amount:      ${AMOUNT} USDC`);
console.log("");
console.log("0\uFE0F\u20E3  Ensuring submitter is funded...");
try {
  const res = await fetch(`https://friendbot.stellar.org?addr=${backupKeypair.publicKey()}`);
  const text = await res.text();
  console.log(text.includes("createAccountAlreadyExist") ? "   Already funded." : "   Funded.");
} catch {
  console.log("   Friendbot skipped.");
}
console.log("1\uFE0F\u20E3  Initializing SmartAccountKit...");
var kit = new SmartAccountKit({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  accountWasmHash: "a12e8fa9621efd20315753bd4007d974390e31fbcb4a7ddc4dd0a0dec728bf2e",
  webauthnVerifierAddress: "CBSHV66WG7UV6FQVUTB67P3DZUEJ2KJ5X6JKQH5MFRAAFNFJUAJVXJYV",
  indexerUrl: false
  // No indexer needed for recovery
});
console.log("2\uFE0F\u20E3  Force-connecting to wallet contract...");
kit.setConnectedState(WALLET_ID, "recovery-mode-no-passkey");
console.log(`   Connected: ${kit.contractId}`);
console.log("3\uFE0F\u20E3  Loading backup key...");
kit.externalSigners.addFromSecret(SECRET);
console.log("4\uFE0F\u20E3  Executing multiSigners.transfer()...");
var selectedSigners = [
  {
    type: "wallet",
    walletAddress: backupKeypair.publicKey(),
    label: "Backup Recovery Key"
  }
];
var result = await kit.multiSigners.transfer(
  USDC_SAC,
  DESTINATION,
  AMOUNT,
  selectedSigners,
  {
    forceMethod: "rpc",
    onLog: (msg) => console.log(`   [SDK] ${msg}`)
  }
);
console.log("");
if (result.success) {
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551  \u2705 RECOVERY SUCCESSFUL                              \u2551");
  console.log("\u2551  Funds moved WITHOUT Radox servers.                  \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.log(`   TX: ${result.hash}`);
} else {
  console.log("\u274C FAILED:", result.error);
}
