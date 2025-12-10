import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { SOLANA_RPC_URL } from '../config/solanaConfig';
import idl from './idl/savechain.json';

class ContractService {
  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    this.program = null;
    this.provider = null;
  }

  // Инициализация провайдера и программы
  async initializeProvider(wallet) {
    try {
      this.provider = new AnchorProvider(
        this.connection,
        wallet,
        { preflightCommitment: 'confirmed' }
      );
      // setProvider(this.provider);

      this.program = new Program(idl, this.provider);
      return this.program;
    } catch (error) {
      console.error('Ошибка инициализации провайдера:', error);
      throw error;
    }
  }

  // Создание копилки (vault)
  async createVault(userPublicKey) {
    try {
      const [vaultPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), new PublicKey(userPublicKey).toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .createVault()
        .accounts({
          vault: vaultPda,
          user: userPublicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      return {
        success: true,
        transaction: tx,
        vaultAddress: vaultPda.toString()
      };
    } catch (error) {
      console.error('Ошибка создания копилки:', error);
      throw error;
    }
  }

  // Пополнение копилки
  async deposit(userPublicKey, amountSOL) {
    try {
      const [vaultPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), new PublicKey(userPublicKey).toBuffer()],
        this.program.programId
      );

      const amount = new BN(amountSOL * 1e9); // Конвертация SOL в lamports

      const tx = await this.program.methods
        .deposit(amount)
        .accounts({
          vault: vaultPda,
          vaultSystem: vaultPda,
          user: userPublicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      return {
        success: true,
        transaction: tx,
        amount: amountSOL
      };
    } catch (error) {
      console.error('Ошибка пополнения:', error);
      throw error;
    }
  }

  // Вывод из копилки
  async withdraw(userPublicKey, amountSOL) {
    try {
      const [vaultPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), new PublicKey(userPublicKey).toBuffer()],
        this.program.programId
      );

      const amount = new BN(amountSOL * 1e9); // Конвертация SOL в lamports

      const tx = await this.program.methods
        .withdraw(amount)
        .accounts({
          vault: vaultPda,
          vaultSystem: vaultPda,
          user: userPublicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      return {
        success: true,
        transaction: tx,
        amount: amountSOL
      };
    } catch (error) {
      console.error('Ошибка вывода:', error);
      throw error;
    }
  }

  // Получение информации о копилке
  async getVaultInfo(userPublicKey) {
    try {
      const [vaultPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), new PublicKey(userPublicKey).toBuffer()],
        this.program.programId
      );

      const vaultAccount = await this.program.account.vault.fetch(vaultPda);
      
      return {
        vaultAddress: vaultPda.toString(),
        owner: vaultAccount.owner.toString(),
        balance: vaultAccount.balance.toNumber() / 1e9,
        bump: vaultAccount.bump
      };
    } catch (error) {
      console.error('Ошибка получения информации о копилке:', error);
      return null;
    }
  }
}

export const contractService = new ContractService();