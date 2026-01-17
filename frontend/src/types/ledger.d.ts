// Type declarations for Ledger HW packages
// These are optional dependencies loaded at runtime

declare module '@ledgerhq/hw-transport-webusb' {
    export default class TransportWebUSB {
        static create(): Promise<TransportWebUSB>;
        close(): Promise<void>;
    }
}

declare module '@ledgerhq/hw-app-str' {
    export default class Str {
        constructor(transport: unknown);
        getPublicKey(path: string): Promise<{ publicKey: string; appVersion?: string }>;
        signTransaction(path: string, signatureBase: Buffer): Promise<{ signature: Buffer }>;
    }
}
