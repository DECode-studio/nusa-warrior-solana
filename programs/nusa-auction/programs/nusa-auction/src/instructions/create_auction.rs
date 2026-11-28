use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::constants::MPL_CORE_PROGRAM_ID;
use crate::errors::AuctionError;
use crate::instructions::helpers::{build_mpl_core_transfer_ix, validate_auction_params};
use crate::state::{AuctionConfig, AuctionState, AuctionStatus};

pub fn handle_create_auction_token_2022(
    ctx: Context<CreateAuctionToken2022>,
    auction_id: String,
    starting_price: u64,
    duration_secs: i64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    validate_auction_params(&auction_id, starting_price, duration_secs, config)?;

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.seller_card_ata.to_account_info(),
                mint: ctx.accounts.card_mint.to_account_info(),
                to: ctx.accounts.auction_card_ata.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        1,
        ctx.accounts.card_mint.decimals,
    )?;

    let now = Clock::get()?.unix_timestamp;
    let ends_at = now
        .checked_add(duration_secs)
        .ok_or(AuctionError::MathOverflow)?;

    let auction = &mut ctx.accounts.auction;
    auction.auction_id = auction_id;
    auction.seller = ctx.accounts.seller.key();
    auction.card_mint = ctx.accounts.card_mint.key();
    auction.is_core_nft = false;
    auction.collection = None;
    auction.starting_price = starting_price;
    auction.current_highest_bid = 0;
    auction.highest_bidder = Pubkey::default();
    auction.bid_count = 0;
    auction.created_at = now;
    auction.original_ends_at = ends_at;
    auction.ends_at = ends_at;
    auction.extended_secs = 0;
    auction.status = AuctionStatus::Active;
    auction.bump = ctx.bumps.auction;
    Ok(())
}

pub fn handle_create_auction_core_nft(
    ctx: Context<CreateAuctionCoreNft>,
    auction_id: String,
    starting_price: u64,
    duration_secs: i64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    validate_auction_params(&auction_id, starting_price, duration_secs, config)?;

    let collection_key = ctx
        .accounts
        .collection
        .as_ref()
        .map(|c| c.key())
        .unwrap_or(MPL_CORE_PROGRAM_ID);

    let ix = build_mpl_core_transfer_ix(
        ctx.accounts.asset.key(),
        collection_key,
        ctx.accounts.seller.key(),
        ctx.accounts.seller.key(),
        ctx.accounts.auction.key(),
    );

    let mut account_infos = vec![
        ctx.accounts.asset.to_account_info(),
        ctx.accounts.seller.to_account_info(),
        ctx.accounts.auction.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.mpl_core_program.to_account_info(),
    ];
    if let Some(collection) = ctx.accounts.collection.as_ref() {
        account_infos.push(collection.to_account_info());
    }
    invoke(&ix, &account_infos)?;

    let now = Clock::get()?.unix_timestamp;
    let ends_at = now
        .checked_add(duration_secs)
        .ok_or(AuctionError::MathOverflow)?;

    let auction = &mut ctx.accounts.auction;
    auction.auction_id = auction_id;
    auction.seller = ctx.accounts.seller.key();
    auction.card_mint = ctx.accounts.asset.key();
    auction.is_core_nft = true;
    auction.collection = ctx.accounts.collection.as_ref().map(|c| c.key());
    auction.starting_price = starting_price;
    auction.current_highest_bid = 0;
    auction.highest_bidder = Pubkey::default();
    auction.bid_count = 0;
    auction.created_at = now;
    auction.original_ends_at = ends_at;
    auction.ends_at = ends_at;
    auction.extended_secs = 0;
    auction.status = AuctionStatus::Active;
    auction.bump = ctx.bumps.auction;
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct CreateAuctionToken2022<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(seeds = [b"auction_config"], bump = config.bump)]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        init,
        payer = seller,
        space = 8 + AuctionState::INIT_SPACE,
        seeds = [b"auction", auction_id.as_bytes()],
        bump
    )]
    pub auction: Account<'info, AuctionState>,
    pub card_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = card_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_card_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = card_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_card_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct CreateAuctionCoreNft<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(seeds = [b"auction_config"], bump = config.bump)]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        init,
        payer = seller,
        space = 8 + AuctionState::INIT_SPACE,
        seeds = [b"auction", auction_id.as_bytes()],
        bump
    )]
    pub auction: Account<'info, AuctionState>,
    /// CHECK: Metaplex Core asset account validated by mpl-core CPI.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
