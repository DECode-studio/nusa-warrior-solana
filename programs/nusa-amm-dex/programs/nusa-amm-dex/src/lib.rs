use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

declare_id!("7WdVgAhEJkaULUF2QnW3a6jqJyc6QeQeKnbN32rTDmJ5");

#[program]
pub mod nusa_amm_dex {
    use super::*;

    /// Initializes a constant-product (x * y = k) AMM liquidity pool for two Token-2022 mints.
    /// Mints must be canonically ordered (mint_a < mint_b).
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
        require!(
            ctx.accounts.mint_a.key() < ctx.accounts.mint_b.key(),
            AmmError::InvalidMintOrder
        );
        require!(fee_bps <= 1_000, AmmError::InvalidFeeBps);

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.mint_a = ctx.accounts.mint_a.key();
        pool.mint_b = ctx.accounts.mint_b.key();
        pool.vault_a = ctx.accounts.vault_a.key();
        pool.vault_b = ctx.accounts.vault_b.key();
        pool.fee_bps = fee_bps;
        pool.bump = ctx.bumps.pool;

        emit!(PoolInitialized {
            pool: pool.key(),
            mint_a: pool.mint_a,
            mint_b: pool.mint_b,
            fee_bps,
        });

        Ok(())
    }

    /// Deposits token_a and token_b liquidity into the pool vaults.
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        require!(amount_a > 0 && amount_b > 0, AmmError::InvalidAmount);

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.provider_ata_a.to_account_info(),
                    mint: ctx.accounts.mint_a.to_account_info(),
                    to: ctx.accounts.vault_a.to_account_info(),
                    authority: ctx.accounts.provider.to_account_info(),
                },
            ),
            amount_a,
            ctx.accounts.mint_a.decimals,
        )?;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.provider_ata_b.to_account_info(),
                    mint: ctx.accounts.mint_b.to_account_info(),
                    to: ctx.accounts.vault_b.to_account_info(),
                    authority: ctx.accounts.provider.to_account_info(),
                },
            ),
            amount_b,
            ctx.accounts.mint_b.decimals,
        )?;

        emit!(LiquidityAdded {
            pool: ctx.accounts.pool.key(),
            provider: ctx.accounts.provider.key(),
            amount_a,
            amount_b,
        });

        Ok(())
    }

    /// Executes an on-chain constant-product (x * y = k) swap.
    /// `a_to_b = true` swaps mint_a -> mint_b; `a_to_b = false` swaps mint_b -> mint_a.
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        a_to_b: bool,
    ) -> Result<()> {
        require!(amount_in > 0, AmmError::InvalidAmount);

        let pool = &ctx.accounts.pool;
        let reserve_a = ctx.accounts.vault_a.amount as u128;
        let reserve_b = ctx.accounts.vault_b.amount as u128;
        require!(reserve_a > 0 && reserve_b > 0, AmmError::EmptyPool);

        let (reserve_in, reserve_out) = if a_to_b {
            (reserve_a, reserve_b)
        } else {
            (reserve_b, reserve_a)
        };

        // Constant product x * y = k with fee_bps
        let fee_denom: u128 = 10_000;
        let fee_mult = fee_denom
            .checked_sub(pool.fee_bps as u128)
            .ok_or(AmmError::MathOverflow)?;
        let amount_in_with_fee = (amount_in as u128)
            .checked_mul(fee_mult)
            .ok_or(AmmError::MathOverflow)?;
        let numerator = amount_in_with_fee
            .checked_mul(reserve_out)
            .ok_or(AmmError::MathOverflow)?;
        let denominator = reserve_in
            .checked_mul(fee_denom)
            .ok_or(AmmError::MathOverflow)?
            .checked_add(amount_in_with_fee)
            .ok_or(AmmError::MathOverflow)?;

        let amount_out_u128 = numerator
            .checked_div(denominator)
            .ok_or(AmmError::MathOverflow)?;
        let amount_out = u64::try_from(amount_out_u128).map_err(|_| AmmError::MathOverflow)?;

        require!(amount_out > 0, AmmError::ZeroOutput);
        require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);
        require!(
            (amount_out as u128) < reserve_out,
            AmmError::InsufficientLiquidity
        );

        let mint_a_key = pool.mint_a;
        let mint_b_key = pool.mint_b;
        let bump = pool.bump;
        let signer_seeds: &[&[&[u8]]] =
            &[&[b"amm_pool", mint_a_key.as_ref(), mint_b_key.as_ref(), &[bump]]];

        if a_to_b {
            // Trader sends mint_a -> vault_a
            transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.trader_ata_a.to_account_info(),
                        mint: ctx.accounts.mint_a.to_account_info(),
                        to: ctx.accounts.vault_a.to_account_info(),
                        authority: ctx.accounts.trader.to_account_info(),
                    },
                ),
                amount_in,
                ctx.accounts.mint_a.decimals,
            )?;

            // Pool PDA sends mint_b from vault_b -> trader_ata_b
            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault_b.to_account_info(),
                        mint: ctx.accounts.mint_b.to_account_info(),
                        to: ctx.accounts.trader_ata_b.to_account_info(),
                        authority: ctx.accounts.pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_out,
                ctx.accounts.mint_b.decimals,
            )?;
        } else {
            // Trader sends mint_b -> vault_b
            transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.trader_ata_b.to_account_info(),
                        mint: ctx.accounts.mint_b.to_account_info(),
                        to: ctx.accounts.vault_b.to_account_info(),
                        authority: ctx.accounts.trader.to_account_info(),
                    },
                ),
                amount_in,
                ctx.accounts.mint_b.decimals,
            )?;

            // Pool PDA sends mint_a from vault_a -> trader_ata_a
            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault_a.to_account_info(),
                        mint: ctx.accounts.mint_a.to_account_info(),
                        to: ctx.accounts.trader_ata_a.to_account_info(),
                        authority: ctx.accounts.pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_out,
                ctx.accounts.mint_a.decimals,
            )?;
        }

        emit!(SwapExecuted {
            pool: ctx.accounts.pool.key(),
            trader: ctx.accounts.trader.key(),
            a_to_b,
            amount_in,
            amount_out,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"amm_pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint_a,
        associated_token::authority = pool,
        associated_token::token_program = token_program,
    )]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint_b,
        associated_token::authority = pool,
        associated_token::token_program = token_program,
    )]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,

    #[account(
        seeds = [b"amm_pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump = pool.bump,
        has_one = mint_a,
        has_one = mint_b,
        has_one = vault_a,
        has_one = vault_b,
    )]
    pub pool: Account<'info, Pool>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = provider,
        associated_token::token_program = token_program,
    )]
    pub provider_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = provider,
        associated_token::token_program = token_program,
    )]
    pub provider_ata_b: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        seeds = [b"amm_pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump = pool.bump,
        has_one = mint_a,
        has_one = mint_b,
        has_one = vault_a,
        has_one = vault_b,
    )]
    pub pool: Account<'info, Pool>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = trader,
        associated_token::mint = mint_a,
        associated_token::authority = trader,
        associated_token::token_program = token_program,
    )]
    pub trader_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = trader,
        associated_token::mint = mint_b,
        associated_token::authority = trader,
        associated_token::token_program = token_program,
    )]
    pub trader_ata_b: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub vault_a: Pubkey,
    pub vault_b: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub fee_bps: u16,
}

#[event]
pub struct LiquidityAdded {
    pub pool: Pubkey,
    pub provider: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
}

#[event]
pub struct SwapExecuted {
    pub pool: Pubkey,
    pub trader: Pubkey,
    pub a_to_b: bool,
    pub amount_in: u64,
    pub amount_out: u64,
}

#[error_code]
pub enum AmmError {
    #[msg("Mints must be canonically ordered (mint_a < mint_b)")]
    InvalidMintOrder,
    #[msg("Fee bps must be <= 1000")]
    InvalidFeeBps,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Pool has no liquidity")]
    EmptyPool,
    #[msg("Calculated swap output is zero")]
    ZeroOutput,
    #[msg("Swap output is below minimum expected (slippage exceeded)")]
    SlippageExceeded,
    #[msg("Insufficient pool liquidity for swap")]
    InsufficientLiquidity,
    #[msg("Math overflow during AMM calculation")]
    MathOverflow,
}
