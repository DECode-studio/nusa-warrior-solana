use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::constants::{
    ANTI_SNIPE_EXTENSION_SECS, ANTI_SNIPE_MAX_EXTENSION_SECS, ANTI_SNIPE_WINDOW_SECS,
    MAX_DURATION_HARD_CAP_SECS, MAX_FEE_BPS, NUSA_WHOLE_UNIT,
};
use crate::errors::AuctionError;
use crate::state::AuctionConfig;

pub fn handle_initialize_config(
    ctx: Context<InitializeConfig>,
    settler: Pubkey,
    fee_treasury: Pubkey,
    fee_bps: u16,
    min_bid_increment: u64,
    min_starting_price: u64,
    min_duration_secs: i64,
    max_duration_secs: i64,
) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, AuctionError::InvalidFeeBps);
    require!(
        min_bid_increment > 0 && min_bid_increment % NUSA_WHOLE_UNIT == 0,
        AuctionError::InvalidBidAmount
    );
    require!(
        min_starting_price > 0 && min_starting_price % NUSA_WHOLE_UNIT == 0,
        AuctionError::InvalidStartingPrice
    );
    require!(
        min_duration_secs > 0
            && max_duration_secs >= min_duration_secs
            && max_duration_secs <= MAX_DURATION_HARD_CAP_SECS,
        AuctionError::InvalidDuration
    );

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.settler = settler;
    config.fee_treasury = fee_treasury;
    config.nusa_mint = ctx.accounts.nusa_mint.key();
    config.fee_bps = fee_bps;
    config.min_bid_increment = min_bid_increment;
    config.min_starting_price = min_starting_price;
    config.min_duration_secs = min_duration_secs;
    config.max_duration_secs = max_duration_secs;
    config.anti_snipe_window_secs = ANTI_SNIPE_WINDOW_SECS;
    config.anti_snipe_extension_secs = ANTI_SNIPE_EXTENSION_SECS;
    config.anti_snipe_max_extension_secs = ANTI_SNIPE_MAX_EXTENSION_SECS;
    config.bump = ctx.bumps.config;
    Ok(())
}

pub fn handle_update_config(
    ctx: Context<UpdateConfig>,
    new_admin: Option<Pubkey>,
    new_settler: Option<Pubkey>,
    new_fee_treasury: Option<Pubkey>,
    new_fee_bps: Option<u16>,
    new_min_bid_increment: Option<u64>,
    new_min_starting_price: Option<u64>,
    new_min_duration_secs: Option<i64>,
    new_max_duration_secs: Option<i64>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    if let Some(admin) = new_admin {
        config.admin = admin;
    }
    if let Some(settler) = new_settler {
        config.settler = settler;
    }
    if let Some(treasury) = new_fee_treasury {
        config.fee_treasury = treasury;
    }
    if let Some(bps) = new_fee_bps {
        require!(bps <= MAX_FEE_BPS, AuctionError::InvalidFeeBps);
        config.fee_bps = bps;
    }
    if let Some(inc) = new_min_bid_increment {
        require!(
            inc > 0 && inc % NUSA_WHOLE_UNIT == 0,
            AuctionError::InvalidBidAmount
        );
        config.min_bid_increment = inc;
    }
    if let Some(min_price) = new_min_starting_price {
        require!(
            min_price > 0 && min_price % NUSA_WHOLE_UNIT == 0,
            AuctionError::InvalidStartingPrice
        );
        config.min_starting_price = min_price;
    }
    let next_min = new_min_duration_secs.unwrap_or(config.min_duration_secs);
    let next_max = new_max_duration_secs.unwrap_or(config.max_duration_secs);
    require!(
        next_min > 0 && next_max >= next_min && next_max <= MAX_DURATION_HARD_CAP_SECS,
        AuctionError::InvalidDuration
    );
    config.min_duration_secs = next_min;
    config.max_duration_secs = next_max;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub nusa_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = 8 + AuctionConfig::INIT_SPACE,
        seeds = [b"auction_config"],
        bump
    )]
    pub config: Account<'info, AuctionConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"auction_config"],
        bump = config.bump,
        has_one = admin @ AuctionError::Unauthorized
    )]
    pub config: Account<'info, AuctionConfig>,
}
