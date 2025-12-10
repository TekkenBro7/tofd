// Сервис для работы с Solana и Phantom
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { SOLANA_RPC_URL, SAVECHAIN_PROGRAM_ID, NETWORK } from '../config/solanaConfig';

class SolanaService {
  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    this.programId = new PublicKey(SAVECHAIN_PROGRAM_ID);
    this.wallet = null;
  }

  // Проверка наличия Phantom
  async checkPhantom() {
    const { solana } = window;
    
    if (!solana || !solana.isPhantom) {
      throw new Error('Phantom кошелек не найден. Пожалуйста, установите расширение.');
    }
    
    return solana;
  }

  // Подключение Phantom кошелька
  async connectWallet() {
    try {
      const phantom = await this.checkPhantom();
      
      // Запрашиваем подключение
      const response = await phantom.connect();
      this.wallet = response.publicKey;
      
      // Сохраняем в localStorage
      localStorage.setItem('phantom_wallet', this.wallet.toString());
      
      return {
        success: true,
        publicKey: this.wallet.toString(),
        wallet: this.wallet
      };
    } catch (error) {
      console.error('Ошибка подключения кошелька:', error);
      throw error;
    }
  }

  // Отключение кошелька
  async disconnectWallet() {
    try {
      const phantom = await this.checkPhantom();
      await phantom.disconnect();
      
      localStorage.removeItem('phantom_wallet');
      this.wallet = null;
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка отключения кошелька:', error);
      throw error;
    }
  }

  // Проверка подключенного кошелька
  async getWalletFromStorage() {
    try {
      const storedWallet = localStorage.getItem('phantom_wallet');
      if (!storedWallet) return null;

      const phantom = await this.checkPhantom();
      
      // Проверяем, подключен ли кошелек
      if (phantom.isConnected) {
        const response = await phantom.connect({ onlyIfTrusted: true });
        this.wallet = response.publicKey;
        
        if (this.wallet.toString() === storedWallet) {
          return {
            publicKey: this.wallet.toString(),
            wallet: this.wallet
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка получения кошелька:', error);
      return null;
    }
  }

  // Получение баланса
  async getBalance(publicKey) {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / 1e9; // Конвертация lamports в SOL
    } catch (error) {
      console.error('Ошибка получения баланса:', error);
      throw error;
    }
  }

  // Получение баланса PDA (копилки)
  async getVaultBalance(userPublicKey) {
    try {
      const [vaultPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), new PublicKey(userPublicKey).toBuffer()],
        this.programId
      );

      const balance = await this.connection.getBalance(vaultPda);
      return {
        vaultAddress: vaultPda.toString(),
        balance: balance / 1e9,
        lamports: balance
      };
    } catch (error) {
      console.error('Ошибка получения баланса копилки:', error);
      throw error;
    }
  }
}

export const solanaService = new SolanaService();