export class TransactionError extends Error {
  public code: TransactionErrorCode;
  public cause?: Error;

  constructor(code: TransactionErrorCode, message: string, cause?: Error) {
    super(message);
    this.name = "TransactionError";
    this.code = code;
    this.cause = cause;
  }
}

export enum TransactionErrorCode {
  WALLET_NOT_READY = "WALLET_NOT_READY",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  NETWORK_ERROR = "NETWORK_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  NONCE_ERROR = "NONCE_ERROR",
  OFFLINE_TRANSACTION_ERROR = "OFFLINE_TRANSACTION_ERROR",
  INVALID_ADDRESS = "INVALID_ADDRESS",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  INVALID_MEMO = "INVALID_MEMO",
  INVALID_NONCE = "INVALID_NONCE",
  INVALID_BLOCK_HEIGHT = "INVALID_BLOCK_HEIGHT",
  TIMEOUT = "TIMEOUT",
  SYNC_ERROR = "SYNC_ERROR",
  BROADCAST_ERROR = "BROADCAST_ERROR",
  VERIFICATION_ERROR = "VERIFICATION_ERROR",
}

export type TransactionValidationError = {
  code: TransactionErrorCode;
  field: string;
  message: string;
};

export type TransactionValidationResult = {
  isValid: boolean;
  errors: TransactionValidationError[];
};
