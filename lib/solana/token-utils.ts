import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount as getTokenAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

// Known token list - expand as needed
const KNOWN_TOKENS: { [key: string]: TokenInfo } = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/assets/images/icons/dollar-icon.png",
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    logo: "/assets/images/icons/bonk-icon.png",
  },
  // Add more tokens as needed
};

export class TokenUtils {
  constructor(private connection: Connection) {}

  async getTokenInfo(mint: string): Promise<TokenInfo> {
    // Check if it's a known token
    if (KNOWN_TOKENS[mint]) {
      return KNOWN_TOKENS[mint];
    }

    // If not known, fetch from chain
    try {
      const mintInfo = await getMint(this.connection, new PublicKey(mint));
      return {
        symbol: "Unknown",
        name: "Unknown Token",
        decimals: mintInfo.decimals,
      };
    } catch (error) {
      throw new Error(`Failed to get token info for mint ${mint}: ${error}`);
    }
  }

  async getTokenBalance(
    owner: PublicKey,
    mint: PublicKey
  ): Promise<{
    amount: number;
    decimals: number;
  }> {
    try {
      const ata = await getAssociatedTokenAddress(mint, owner);
      const account = await getTokenAccount(this.connection, ata);
      const mintInfo = await getMint(this.connection, account.mint);
      return {
        amount: Number(account.amount),
        decimals: mintInfo.decimals,
      };
    } catch (error) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        return { amount: 0, decimals: 0 };
      }
      throw error;
    }
  }

  async createTransferInstructions(params: {
    fromPubkey: PublicKey;
    toPubkey: PublicKey;
    mint: PublicKey;
    amount: number;
    payer: PublicKey;
  }) {
    const { fromPubkey, toPubkey, mint, amount, payer } = params;

    // Get associated token accounts
    const fromATA = await getAssociatedTokenAddress(mint, fromPubkey);
    const toATA = await getAssociatedTokenAddress(mint, toPubkey);

    const instructions = [];

    // Create destination ATA if it doesn't exist
    try {
      await getTokenAccount(this.connection, toATA);
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            payer, // payer
            toATA, // ata
            toPubkey, // owner
            mint // mint
          )
        );
      }
    }

    // Add transfer instruction
    const mintInfo = await getMint(this.connection, mint);
    const tokenAmount = amount * Math.pow(10, mintInfo.decimals);

    instructions.push(
      createTransferInstruction(
        fromATA, // source
        toATA, // destination
        fromPubkey, // owner
        BigInt(Math.floor(tokenAmount))
      )
    );

    return instructions;
  }
}
