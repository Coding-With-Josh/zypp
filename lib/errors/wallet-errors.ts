export class WalletError extends Error {
  code: string;
  context?: any;

  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = "WalletError";
    this.code = code;
    this.context = context;
  }
}

export class NonceError extends WalletError {
  constructor(message: string, context?: any) {
    super(message, "NONCE_ERROR", context);
    this.name = "NonceError";
  }
}

export class TransactionError extends WalletError {
  constructor(message: string, context?: any) {
    super(message, "TRANSACTION_ERROR", context);
    this.name = "TransactionError";
  }
}

export class StorageError extends WalletError {
  constructor(message: string, context?: any) {
    super(message, "STORAGE_ERROR", context);
    this.name = "StorageError";
  }
}

export const ErrorCodes = {
  NONCE: {
    CREATION_FAILED: "NONCE_CREATION_FAILED",
    ADVANCE_FAILED: "NONCE_ADVANCE_FAILED",
    VERIFICATION_FAILED: "NONCE_VERIFICATION_FAILED",
    EXPIRED: "NONCE_EXPIRED",
    NOT_FOUND: "NONCE_NOT_FOUND",
  },
  TRANSACTION: {
    SEND_FAILED: "TRANSACTION_SEND_FAILED",
    CONFIRMATION_FAILED: "TRANSACTION_CONFIRMATION_FAILED",
    BROADCAST_FAILED: "TRANSACTION_BROADCAST_FAILED",
    INVALID_AMOUNT: "TRANSACTION_INVALID_AMOUNT",
    INSUFFICIENT_FUNDS: "TRANSACTION_INSUFFICIENT_FUNDS",
  },
  STORAGE: {
    READ_FAILED: "STORAGE_READ_FAILED",
    WRITE_FAILED: "STORAGE_WRITE_FAILED",
    ENCRYPTION_FAILED: "STORAGE_ENCRYPTION_FAILED",
  },
} as const;
