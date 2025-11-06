import { logger } from "../utils/logger";

export interface TransactionLogData {
  id: string;
  type: string;
  status: string;
  amount: number;
  from?: string;
  to?: string;
  error?: Error;
  networkInfo?: {
    signature?: string;
    blockhash?: string;
    lastValidBlockHeight?: number;
  };
}

class TransactionLogger {
  private namespace = "transactions";

  public logTransactionCreated(data: TransactionLogData) {
    logger.info(`${this.namespace}:created`, {
      transactionId: data.id,
      type: data.type,
      amount: data.amount,
      from: data.from,
      to: data.to,
    });
  }

  public logTransactionSigned(data: TransactionLogData) {
    logger.info(`${this.namespace}:signed`, {
      transactionId: data.id,
      signature: data.networkInfo?.signature,
    });
  }

  public logTransactionSubmitted(data: TransactionLogData) {
    logger.info(`${this.namespace}:submitted`, {
      transactionId: data.id,
      signature: data.networkInfo?.signature,
      blockhash: data.networkInfo?.blockhash,
    });
  }

  public logTransactionConfirmed(data: TransactionLogData) {
    logger.info(`${this.namespace}:confirmed`, {
      transactionId: data.id,
      signature: data.networkInfo?.signature,
      status: data.status,
    });
  }

  public logTransactionFailed(data: TransactionLogData) {
    logger.error(`${this.namespace}:failed`, {
      transactionId: data.id,
      error: data.error?.message,
      errorStack: data.error?.stack,
      status: data.status,
    });
  }

  public logTransactionRetry(data: TransactionLogData, attempt: number) {
    logger.warn(`${this.namespace}:retry`, {
      transactionId: data.id,
      attempt,
      lastError: data.error?.message,
    });
  }

  public logOfflineTransaction(data: TransactionLogData) {
    logger.info(`${this.namespace}:offline`, {
      transactionId: data.id,
      type: data.type,
      nonce: data.networkInfo?.blockhash,
    });
  }

  public logSyncAttempt(data: TransactionLogData) {
    logger.info(`${this.namespace}:sync`, {
      transactionId: data.id,
      status: data.status,
    });
  }
}

export const transactionLogger = new TransactionLogger();
