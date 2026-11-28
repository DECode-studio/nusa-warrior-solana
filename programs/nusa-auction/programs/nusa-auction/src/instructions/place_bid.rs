use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::constants::NUSA_WHOLE_UNIT;
use crate::errors::AuctionError;
use crate::state::{AuctionConfig, AuctionState, AuctionStatus, BidEscrow};

pub fn handle_place_bid(
    ctx: Context<PlaceBid>,
    _auction_id: String,
    new_bid_amount: u64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let auction = &mut ctx.accounts.auction;
    let bidder_key = ctx.accounts.bidder.key();

    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );

    let now = Clock::get()?.unix_timestamp;
    require!(now < auction.ends_at, AuctionError::AuctionEnded);
    require!(bidder_key != auction.seller, AuctionError::SellerCannotBid);
    require!(
        bidder_key != auction.highest_bidder,
        AuctionError::AlreadyHighestBidder
    );
    require!(
        new_bid_amount > 0 && new_bid_amount % NUSA_WHOLE_UNIT == 0,
        AuctionError::InvalidBidAmount
    );

    let base_price = if auction.bid_count == 0 {
        auction.starting_price
    } else {
        auction.current_highest_bid
    };
    let min_required = base_price
        .checked_add(config.min_bid_increment)
        .ok_or(AuctionError::MathOverflow)?;
    require!(new_bid_amount >= min_required, AuctionError::BidTooLow);

    let bid_escrow = &mut ctx.accounts.bid_escrow;
    let already_held = if bid_escrow.auction == auction.key() {
        bid_escrow.amount
    } else {
        0
    };
    require!(new_bid_amount > already_held, AuctionError::BidTooLow);

    let delta = new_bid_amount
        .checked_sub(already_held)
        .ok_or(AuctionError::MathOverflow)?;

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.bidder_nusa_ata.to_account_info(),
                mint: ctx.accounts.nusa_mint.to_account_info(),
                to: ctx.accounts.auction_nusa_ata.to_account_info(),
                authority: ctx.accounts.bidder.to_account_info(),
            },
        ),
        delta,
        ctx.accounts.nusa_mint.decimals,
    )?;

    bid_escrow.auction = auction.key();
    bid_escrow.bidder = bidder_key;
    bid_escrow.amount = new_bid_amount;
    bid_escrow.last_bid_at = now;
    bid_escrow.bump = ctx.bumps.bid_escrow;

    auction.current_highest_bid = new_bid_amount;
    auction.highest_bidder = bidder_key;
    auction.bid_count = auction
        .bid_count
        .checked_add(1)
        .ok_or(AuctionError::MathOverflow)?;

    let remaining = auction.ends_at.saturating_sub(now);
    if remaining <= config.anti_snipe_window_secs
        && auction.extended_secs < config.anti_snipe_max_extension_secs
    {
        let allowed_extra = config
            .anti_snipe_max_extension_secs
            .saturating_sub(auction.extended_secs);
        let extension = config.anti_snipe_extension_secs.min(allowed_extra);
        auction.ends_at = auction
            .ends_at
            .checked_add(extension)
            .ok_or(AuctionError::MathOverflow)?;
        auction.extended_secs = auction
            .extended_secs
            .checked_add(extension)
            .ok_or(AuctionError::MathOverflow)?;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(
        seeds = [b"auction_config"],
        bump = config.bump,
        constraint = config.nusa_mint == nusa_mint.key() @ AuctionError::InvalidNusaMint
    )]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionState>,
    pub nusa_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = nusa_mint,
        associated_token::authority = bidder,
        associated_token::token_program = token_program
    )]
    pub bidder_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = bidder,
        associated_token::mint = nusa_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = bidder,
        space = 8 + BidEscrow::INIT_SPACE,
        seeds = [b"bid_escrow", auction.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid_escrow: Account<'info, BidEscrow>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
