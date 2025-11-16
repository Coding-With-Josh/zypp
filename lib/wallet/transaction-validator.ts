import { PublicKey } from "@solana/web3.js";
import {
  TransactionErrorCode,
  TransactionValidationError,
} from "../errors/transaction-errors";

export interface TransactionValidationResult {
  isValid: boolean;
  errors: TransactionValidationError[];
}

export class TransactionValidator {
  private static MIN_AMOUNT = 0.000001; // Minimum SOL amount
  private static MAX_AMOUNT = 1000000; // Maximum SOL amount
  private static MAX_MEMO_LENGTH = 1000; // Maximum memo length in bytes

  public static validateSendSOLTransaction(params: {
    toAddress: string;
    amount: number;
    memo?: string;
  }): TransactionValidationResult {
    const errors: TransactionValidationError[] = [];

    // Validate address
    try {
      new PublicKey(params.toAddress);
    } catch (error) {
      errors.push({
        code: TransactionErrorCode.INVALID_ADDRESS,
        field: "toAddress",
        message: "Invalid Solana address",
      });
    }

    // Validate amount
    if (typeof params.amount !== "number" || isNaN(params.amount)) {
      errors.push({
        code: TransactionErrorCode.INVALID_AMOUNT,
        field: "amount",
        message: "Amount must be a valid number",
      });
    } else if (params.amount < this.MIN_AMOUNT) {
      errors.push({
        code: TransactionErrorCode.INVALID_AMOUNT,
        field: "amount",
        message: `Amount must be at least ${this.MIN_AMOUNT} SOL`,
      });
    } else if (params.amount > this.MAX_AMOUNT) {
      errors.push({
        code: TransactionErrorCode.INVALID_AMOUNT,
        field: "amount",
        message: `Amount cannot exceed ${this.MAX_AMOUNT} SOL`,
      });
    }

    // Validate memo
    if (params.memo && Buffer.from(params.memo).length > this.MAX_MEMO_LENGTH) {
      errors.push({
        code: TransactionErrorCode.INVALID_MEMO,
        field: "memo",
        message: `Memo cannot exceed ${this.MAX_MEMO_LENGTH} bytes`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static validateOfflineTransaction(params: {
    toAddress: string;
    amount: number;
    memo?: string;
    nonce?: string;
  }): TransactionValidationResult {
    const errors: TransactionValidationError[] = [];

    // First validate basic transaction parameters
    const basicValidation = this.validateSendSOLTransaction(params);
    errors.push(...basicValidation.errors);

    // Validate nonce if provided
    if (params.nonce) {
      try {
        const nonceBuffer = Buffer.from(params.nonce, "base64");
        if (nonceBuffer.length !== 32) {
          errors.push({
            code: TransactionErrorCode.INVALID_NONCE,
            field: "nonce",
            message: "Invalid nonce format",
          });
        }
      } catch (error) {
        errors.push({
          code: TransactionErrorCode.INVALID_NONCE,
          field: "nonce",
          message: "Invalid nonce encoding",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static validateTransactionBroadcast(params: {
    signature: string;
    lastValidBlockHeight?: number;
  }): TransactionValidationResult {
    const errors: TransactionValidationError[] = [];

    // Validate signature
    if (!/^[A-Za-z0-9]{87,88}$/.test(params.signature)) {
      errors.push({
        code: TransactionErrorCode.INVALID_SIGNATURE,
        field: "signature",
        message: "Invalid transaction signature format",
      });
    }

    // Validate block height if provided
    if (params.lastValidBlockHeight !== undefined) {
      if (
        !Number.isInteger(params.lastValidBlockHeight) ||
        params.lastValidBlockHeight < 0
      ) {
        errors.push({
          code: TransactionErrorCode.INVALID_BLOCK_HEIGHT,
          field: "lastValidBlockHeight",
          message: "Invalid block height",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
