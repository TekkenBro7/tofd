const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Connection, Keypair } = require("@solana/web3.js");
const fs = require("fs");
const os = require("os");
const path = require("path");

async function main() {

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Загружаем ключ из файла
    const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const wallet = new anchor.Wallet(Keypair.fromSecretKey(Uint8Array.from(keypairData)));

    // Создаём AnchorProvider с указанной сетью и кошельком
    const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: "confirmed",
    });

    //const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Подключаемся к программе через workspace
    const program = anchor.workspace.Savechain;

    const user = provider.wallet.publicKey;

    // PDA для vault
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), user.toBuffer()],
        program.programId
    );

    console.log("Vault PDA:", vaultPda.toBase58());

    console.log("=== Creating vault PDA ===");
    await program.methods
        .createVault()
        .accounts({
        vault: vaultPda,
        user: user,
        systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log("Vault created.");

    console.log("=== Depositing 0.01 SOL ===");
    await program.methods
        .deposit(new anchor.BN(10_000_000)) // 0.01 SOL
        .accounts({
        vault: vaultPda,
        vaultSystem: vaultPda,
        user: user,
        systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log("Deposit OK");

    console.log("=== Withdrawing 0.005 SOL ===");
    await program.methods
        .withdraw(new anchor.BN(5_000_000)) // 0.005 SOL
        .accounts({
        vault: vaultPda,
        vaultSystem: vaultPda,
        user: user,
        systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log("Withdraw OK");

    console.log("=== Detailed verification ===");


    // 1. Program data
    const vaultData = await program.account.vault.fetch(vaultPda);
    console.log("Program counter:", vaultData.balance.toString() / 1e9, "SOL");

    // 2. Real balance
    const realBalance = await provider.connection.getBalance(vaultPda);
    console.log("Real balance:", realBalance / 1e9, "SOL");

    
}

main().catch(console.error);
