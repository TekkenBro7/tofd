use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("3fcaZvjDk3rU6GNDFgSNShCPLNQwsPwqSmGoFM3C3qDF");

#[program]
pub mod savechain {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.user.key();
        vault.bump = ctx.bumps.vault;
        msg!("Vault created for user: {}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.user.to_account_info().lamports() >= amount,
            ErrorCode::InsufficientFunds
        );

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault_system.to_account_info(),  
            },
        );
        system_program::transfer(cpi_ctx, amount)?;

        ctx.accounts.vault.balance += amount;  // Обновляем счётчик
        msg!("Deposited {} lamports to vault", amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Проверяем, что пользователь - владелец хранилища
        require!(
            vault.owner == ctx.accounts.user.key(),
            ErrorCode::Unauthorized
        );

        require!(
            vault.balance >= amount,
            ErrorCode::InsufficientFunds
        );

        // Переводим SOL напрямую
        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;

        // Обновляем баланс в структуре
        vault.balance = vault.balance.checked_sub(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;

        msg!("Withdrew {} lamports from vault", amount);
        Ok(())
    }

}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 1,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    /// CHECK: PDA vault для lamports (SystemAccount)
    #[account(mut, seeds = [b"vault", user.key().as_ref()], bump = vault.bump)]
    pub vault_system: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    /// CHECK: PDA vault для lamports (SystemAccount)
    #[account(mut, seeds = [b"vault", user.key().as_ref()], bump = vault.bump)]
    pub vault_system: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Недостаточно средств")]
    InsufficientFunds,

    #[msg("Неавторизованный доступ")]
    Unauthorized,
}
