use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::constants::MPL_CORE_PROGRAM_ID;
use crate::errors::AuctionError;
use crate::instructions::helpers::{build_mpl_core_transfer_ix, calculate_fee_split};
use crate::state::{AuctionConfig, AuctionState, AuctionStatus, BidEscrow};

pub fn handle_settle_auction_token_2022(
    ctx: Context<SettleAuctionToken2022>,
    auction_id: String,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let auction = &mut ctx.accounts.auction;
    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );
    require!(!auction.is_core_nft, AuctionError::InvalidAssetStandard);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= auction.ends_at, AuctionError::AuctionStillRunning);

    let signer_seeds: &[&[&[u8]]] = &[&[b"auction", auction_id.as_bytes(), &[auction.bump]]];

    if auction.bid_count == 0 {
        require!(
            ctx.accounts.recipient.key() == auction.seller,
            AuctionError::InvalidRecipient
        );
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.auction_card_ata.to_account_info(),
                    mint: ctx.accounts.card_mint.to_account_info(),
                    to: ctx.accounts.recipient_card_ata.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
            1,
            ctx.accounts.card_mint.decimals,
        )?;
        auction.status = AuctionStatus::Expired;
        return Ok(());
    }

    require!(
        ctx.accounts.recipient.key() == auction.highest_bidder,
        AuctionError::InvalidRecipient
    );

    let winning_bid = auction.current_highest_bid;
    let (fee_amount, seller_payout) = calculate_fee_split(winning_bid, config.fee_bps)?;

    if fee_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.auction_nusa_ata.to_account_info(),
                    mint: ctx.accounts.nusa_mint.to_account_info(),
                    to: ctx.accounts.fee_treasury_nusa_ata.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
            fee_amount,
            ctx.accounts.nusa_mint.decimals,
        )?;
    }

    if seller_payout > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.auction_nusa_ata.to_account_info(),
                    mint: ctx.accounts.nusa_mint.to_account_info(),
                    to: ctx.accounts.seller_nusa_ata.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
            seller_payout,
            ctx.accounts.nusa_mint.decimals,
        )?;
    }

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.auction_card_ata.to_account_info(),
                mint: ctx.accounts.card_mint.to_account_info(),
                to: ctx.accounts.recipient_card_ata.to_account_info(),
                authority: auction.to_account_info(),
            },
            signer_seeds,
        ),
        1,
        ctx.accounts.card_mint.decimals,
    )?;

    if let Some(winner_escrow) = ctx.accounts.winner_bid_escrow.as_mut() {
        require!(
            winner_escrow.auction == auction.key()
                && winner_escrow.bidder == auction.highest_bidder,
            AuctionError::InvalidBidEscrow
        );
        winner_escrow.amount = 0;
    }

    auction.status = AuctionStatus::Settled;
    Ok(())
}

pub fn handle_settle_auction_core_nft(
    ctx: Context<SettleAuctionCoreNft>,
    auction_id: String,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let auction = &mut ctx.accounts.auction;
    require!(
        auction.status == AuctionStatus::Active,
        AuctionError::AuctionNotActive
    );
    require!(auction.is_core_nft, AuctionError::InvalidAssetStandard);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= auction.ends_at, AuctionError::AuctionStillRunning);

    let signer_seeds: &[&[&[u8]]] = &[&[b"auction", auction_id.as_bytes(), &[auction.bump]]];
    let collection_key = ctx
        .accounts
        .collection
        .as_ref()
        .map(|c| c.key())
        .unwrap_or(MPL_CORE_PROGRAM_ID);

    if auction.bid_count == 0 {
        require!(
            ctx.accounts.recipient.key() == auction.seller,
            AuctionError::InvalidRecipient
        );
        let ix = build_mpl_core_transfer_ix(
            ctx.accounts.asset.key(),
            collection_key,
            ctx.accounts.payer.key(),
            auction.key(),
            ctx.accounts.recipient.key(),
        );
        let mut account_infos = vec![
            ctx.accounts.asset.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            auction.to_account_info(),
            ctx.accounts.recipient.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.mpl_core_program.to_account_info(),
        ];
        if let Some(collection) = ctx.accounts.collection.as_ref() {
            account_infos.push(collection.to_account_info());
        }
        invoke_signed(&ix, &account_infos, signer_seeds)?;
        auction.status = AuctionStatus::Expired;
        return Ok(());
    }

    require!(
        ctx.accounts.recipient.key() == auction.highest_bidder,
        AuctionError::InvalidRecipient
    );

    let winning_bid = auction.current_highest_bid;
    let (fee_amount, seller_payout) = calculate_fee_split(winning_bid, config.fee_bps)?;

    if fee_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.auction_nusa_ata.to_account_info(),
                    mint: ctx.accounts.nusa_mint.to_account_info(),
                    to: ctx.accounts.fee_treasury_nusa_ata.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
            fee_amount,
            ctx.accounts.nusa_mint.decimals,
        )?;
    }

    if seller_payout > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.auction_nusa_ata.to_account_info(),
                    mint: ctx.accounts.nusa_mint.to_account_info(),
                    to: ctx.accounts.seller_nusa_ata.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
            seller_payout,
            ctx.accounts.nusa_mint.decimals,
        )?;
    }

    let ix = build_mpl_core_transfer_ix(
        ctx.accounts.asset.key(),
        collection_key,
        ctx.accounts.payer.key(),
        auction.key(),
        ctx.accounts.recipient.key(),
    );
    let mut account_infos = vec![
        ctx.accounts.asset.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        auction.to_account_info(),
        ctx.accounts.recipient.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.mpl_core_program.to_account_info(),
    ];
    if let Some(collection) = ctx.accounts.collection.as_ref() {
        account_infos.push(collection.to_account_info());
    }
    invoke_signed(&ix, &account_infos, signer_seeds)?;

    if let Some(winner_escrow) = ctx.accounts.winner_bid_escrow.as_mut() {
        require!(
            winner_escrow.auction == auction.key()
                && winner_escrow.bidder == auction.highest_bidder,
            AuctionError::InvalidBidEscrow
        );
        winner_escrow.amount = 0;
    }

    auction.status = AuctionStatus::Settled;
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct SettleAuctionToken2022<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"auction_config"],
        bump = config.bump,
        constraint = config.nusa_mint == nusa_mint.key() @ AuctionError::InvalidNusaMint,
        constraint = config.fee_treasury == fee_treasury.key() @ AuctionError::InvalidTreasury
    )]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump,
        constraint = auction.seller == seller.key() @ AuctionError::InvalidSeller,
        constraint = auction.card_mint == card_mint.key() @ AuctionError::InvalidCardMint
    )]
    pub auction: Account<'info, AuctionState>,
    /// CHECK: Seller wallet validated against auction.seller.
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Fee treasury wallet validated against config.fee_treasury.
    pub fee_treasury: UncheckedAccount<'info>,
    /// CHECK: Winner wallet (or seller when expired without bids), validated in handler.
    pub recipient: UncheckedAccount<'info>,
    pub card_mint: InterfaceAccount<'info, Mint>,
    pub nusa_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = card_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_card_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = card_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_card_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = fee_treasury,
        associated_token::token_program = token_program
    )]
    pub fee_treasury_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub winner_bid_escrow: Option<Account<'info, BidEscrow>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: String)]
pub struct SettleAuctionCoreNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"auction_config"],
        bump = config.bump,
        constraint = config.nusa_mint == nusa_mint.key() @ AuctionError::InvalidNusaMint,
        constraint = config.fee_treasury == fee_treasury.key() @ AuctionError::InvalidTreasury
    )]
    pub config: Account<'info, AuctionConfig>,
    #[account(
        mut,
        seeds = [b"auction", auction_id.as_bytes()],
        bump = auction.bump,
        constraint = auction.seller == seller.key() @ AuctionError::InvalidSeller,
        constraint = auction.card_mint == asset.key() @ AuctionError::InvalidCardMint
    )]
    pub auction: Account<'info, AuctionState>,
    /// CHECK: Seller wallet validated against auction.seller.
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Fee treasury wallet validated against config.fee_treasury.
    pub fee_treasury: UncheckedAccount<'info>,
    /// CHECK: Winner wallet (or seller when expired without bids), validated in handler.
    pub recipient: UncheckedAccount<'info>,
    /// CHECK: Metaplex Core asset account validated against auction.card_mint.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    pub nusa_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub auction_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = seller,
        associated_token::token_program = token_program
    )]
    pub seller_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = nusa_mint,
        associated_token::authority = fee_treasury,
        associated_token::token_program = token_program
    )]
    pub fee_treasury_nusa_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub winner_bid_escrow: Option<Account<'info, BidEscrow>>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
