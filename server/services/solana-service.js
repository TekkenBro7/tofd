import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ApiError } from '../exceptions/api-error.js';

class SolanaService {
  constructor() {
    const endpoint = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Проверка транзакции и получение суммы перевода
   */
  async verifySignature(signature) {
    if (!signature || typeof signature !== 'string') {
      throw ApiError.BadRequest('Подпись транзакции не указана');
    }

    try {
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (!transaction) {
        throw ApiError.BadRequest('Транзакция Solana не найдена или еще не подтверждена');
      }

      if (transaction.meta && transaction.meta.err) {
        throw ApiError.BadRequest('Транзакция Solana завершилась с ошибкой');
      }

      let lamports = 0;
      
      const instructions = transaction.transaction.message.instructions;

      for (const instruction of instructions) {
        if (instruction.program === 'system' && instruction.parsed) {
          if (instruction.parsed.type === 'transfer') {
            lamports += Number(instruction.parsed.info.lamports);
          }
        }
      }
      
      return { 
        success: true, 
        signature, 
        amount: lamports 
      };
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Solana RPC error:', error);
      throw ApiError.BadRequest('Не удалось проверить подпись транзакции Solana');
    }
  }
}

export const solanaService = new SolanaService();