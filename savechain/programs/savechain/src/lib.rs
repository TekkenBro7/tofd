use anchor_lang::prelude::*;

declare_id!("4HAdHhmHyTSn7KyDNy6naxc2N2X5Bqy5JFt6cV3t23Nb");

#[program]
pub mod savechain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
