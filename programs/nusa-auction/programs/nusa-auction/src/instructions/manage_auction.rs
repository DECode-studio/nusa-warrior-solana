use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::constants::{MPL_CORE_PROGRAM_ID, NUSA_WHOLE_UNIT};
use crate::errors::AuctionError;
use crate::instructions::helpers::build_mpl_core_transfer_ix;
use crate::state::{AuctionConfig, AuctionState, AuctionStatus};

pub fn handle_update_auction(
    ctx: Context<UpdateAuction>,
    _auction_id: String,
    new_starting_price: u64,
    new_duration_secs: i64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let auction = &mut ctx.accounts.auction;

    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );
    require!(auction.bid_count == 0, AuctionError::AuctionAlreadyHasBids);

    let now = Clock::get()?.unix_timestamp;
    require!(now < auction.ends_at, AuctionError::AuctionEnded);
    require!(
        new_starting_price >= config.min_starting_price
            && new_starting_price % NUSA_WHOLE_UNIT == 0,
        AuctionError::InvalidStartingPrice
    );
    require!(
        new_duration_secs >= config.min_duration_secs
            && new_duration_secs <= config.max_duration_secs,
        AuctionError::InvalidDuration
    );

    let new_ends_at = auction
        .created_at
        .checked_add(new_duration_secs)
        .ok_or(AuctionError::MathOverflow)?;
    require!(new_ends_at > now, AuctionError::InvalidDuration);

    auction.starting_price = new_starting_price;
    auction.original_ends_at = new_ends_at;
    auction.ends_at = new_ends_at;
    Ok(())
}

pub fn handle_cancel_auction_token_2022(
    ctx: Context<CancelAuctionToken2022>,
    auction_id: String,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );
    require!(auction.bid_count == 0, AuctionError::AuctionAlreadyHasBids);
    require!(!auction.is_core_nft, AuctionError::InvalidAssetStandard);

    let signer_seeds: &[&[&[u8]]] = &[&[b"auction", auction_id.as_bytes(), &[auction.bump]]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.auction_card_ata.to_account_info(),
                mint: ctx.accounts.card_mint.to_account_info(),
                to: ctx.accounts.seller_card_ata.to_account_info(),
                authority: auction.to_account_info(),
            },
            signer_seeds,
        ),
        1,
        ctx.accounts.card_mint.decimals,
    )?;

    auction.status = AuctionStatus::Cancelled;
    Ok(())
}

pub fn handle_cancel_auction_core_nft(
    ctx: Context<CancelAuctionCoreNft>,
    auction_id: String,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );
    require!(auction.bid_count == 0, AuctionError::AuctionAlreadyHasBids);
    require!(auction.is_core_nft, AuctionError::InvalidAssetStandard);

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
        auction.key(),
        ctx.accounts.seller.key(),
    );

    let signer_seeds: &[&[&[u8]]] = &[&[b"auction", auction_id.as_bytes(), &[auction.bump]]];

    let mut account_infos = vec![
        ctx.accounts.asset.to_account_info(),
        ctx.accounts.seller.to_account_info(),
        auction.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.mpl_core_program.to_account_info(),
    ];
    if let Some(collection) = ctx.accounts.collection.as_ref() {
        account_infos.push(collection.to_account_info());
    }
    invoke_signed(&ix, &account_infos, signer_seeds)?;

    auction.status = AuctionStatus::Cancelled;
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct UpdateAuction<'info> {
    pub seller: Signer<'info>,
    #[account(seeds = [b"auction_config"], bump = config.bump)]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump,
        has_one = seller @ AuctionError::Unauthorized
    )]
    pub auction: Account<'info, AuctionState>,
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct CancelAuctionToken2022<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump,
        has_one = seller @ AuctionError::Unauthorized,
        constraint = auction.card_mint == card_mint.key() @ AuctionError::InvalidCardMint
    )]
    pub auction: Account<'info, AuctionState>,
    pub card_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = card_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_card_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = card_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_card_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct CancelAuctionCoreNft<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump,
        has_one = seller @ AuctionError::Unauthorized,
        constraint = auction.card_mint == asset.key() @ AuctionError::InvalidCardMint
    )]
    pub auction: Account<'info, AuctionState>,
    /// CHECK: Metaplex Core asset account validated by constraint and CPI.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
