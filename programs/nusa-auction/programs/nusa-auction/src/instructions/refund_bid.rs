use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::errors::AuctionError;
use crate::state::{AuctionConfig, AuctionState, AuctionStatus, BidEscrow};

pub fn handle_refund_losing_bid(
    ctx: Context<RefundLosingBid>,
    auction_id: String,
) -> Result<()> {
    let auction = &ctx.accounts.auction;
    let now = Clock::get()?.unix_timestamp;
    let can_refund = auction.status == AuctionStatus::Settled
        || auction.status == AuctionStatus::Expired
        || auction.status == AuctionStatus::Cancelled
        || now >= auction.ends_at;
    require!(can_refund, AuctionError::AuctionStillRunning);

    let bid_escrow = &ctx.accounts.bid_escrow;
    require!(
        bid_escrow.bidder != auction.highest_bidder,
        AuctionError::WinnerCannotRefund
    );
    require!(bid_escrow.amount > 0, AuctionError::NothingToRefund);

    let signer_seeds: &[&[&[u8]]] = &[&[b"auction", auction_id.as_bytes(), &[auction.bump]]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.auction_nusa_ata.to_account_info(),
                mint: ctx.accounts.nusa_mint.to_account_info(),
                to: ctx.accounts.bidder_nusa_ata.to_account_info(),
                authority: auction.to_account_info(),
            },
            signer_seeds,
        ),
        bid_escrow.amount,
        ctx.accounts.nusa_mint.decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct RefundLosingBid<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"auction_config"],
        bump = config.bump,
        constraint = config.nusa_mint == nusa_mint.key() @ AuctionError::InvalidNusaMint
    )]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionState>,
    /// CHECK: Losing bidder receiving full NUSA refund and BidEscrow rent.
    #[account(mut)]
    pub bidder: UncheckedAccount<'info>,
    pub nusa_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = nusa_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = bidder,
        associated_token::token_program = token_program
    )]
    pub bidder_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        close = bidder,
        seeds = [b"bid_escrow", auction.key().as_ref(), bidder.key().as_ref()],
        bump = bid_escrow.bump,
        has_one = bidder @ AuctionError::InvalidBidEscrow,
        has_one = auction @ AuctionError::InvalidBidEscrow
    )]
    pub bid_escrow: Account<'info, BidEscrow>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
