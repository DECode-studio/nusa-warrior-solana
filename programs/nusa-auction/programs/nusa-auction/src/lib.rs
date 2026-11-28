use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

declare_id!("CvZTfH3fqdR6StvxRoqjHxNsJtzwBQAwuHSX8J5RxFHk");

pub const MPL_CORE_PROGRAM_ID: Pubkey =
    pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const MAX_AUCTION_ID_LEN: usize = 48;
const NUSA_WHOLE_UNIT: u64 = 1_000_000;
const MAX_FEE_BPS: u16 = 5_000;
const MAX_DURATION_HARD_CAP_SECS: i64 = 86_400;
const ANTI_SNIPE_WINDOW_SECS: i64 = 300;
const ANTI_SNIPE_EXTENSION_SECS: i64 = 300;
const ANTI_SNIPE_MAX_EXTENSION_SECS: i64 = 1_800;

#[program]
pub mod nusa_auction {
    use super::*;

    pub fn initialize_config(
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

    pub fn update_config(
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

    pub fn create_auction_token_2022(
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

    pub fn create_auction_core_nft(
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

    pub fn update_auction(
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

        // Enforce max 24h lifetime from original creation so edits cannot extend indefinitely.
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

    pub fn cancel_auction_token_2022(
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

    pub fn cancel_auction_core_nft(
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

    pub fn place_bid(
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

        // Anti-sniping soft-close: extend end time if bid lands inside final window.
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

    pub fn settle_auction_token_2022(
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
            require!(
                ctx.accounts.recipient.key() == auction.seller,
                AuctionError::InvalidRecipient
            );
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

    pub fn settle_auction_core_nft(
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

    pub fn refund_losing_bid(
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
}

fn validate_auction_params(
    auction_id: &str,
    starting_price: u64,
    duration_secs: i64,
    config: &AuctionConfig,
) -> Result<()> {
    require!(
        !auction_id.is_empty() && auction_id.len() <= MAX_AUCTION_ID_LEN,
        AuctionError::InvalidAuctionId
    );
    require!(
        starting_price >= config.min_starting_price && starting_price % NUSA_WHOLE_UNIT == 0,
        AuctionError::InvalidStartingPrice
    );
    require!(
        duration_secs >= config.min_duration_secs && duration_secs <= config.max_duration_secs,
        AuctionError::InvalidDuration
    );
    Ok(())
}

fn calculate_fee_split(winning_bid: u64, fee_bps: u16) -> Result<(u64, u64)> {
    let fee_u128 = (winning_bid as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(AuctionError::MathOverflow)?
        / 10_000u128;
    let fee = u64::try_from(fee_u128).map_err(|_| AuctionError::MathOverflow)?;
    let payout = winning_bid
        .checked_sub(fee)
        .ok_or(AuctionError::MathOverflow)?;
    Ok((fee, payout))
}

fn build_mpl_core_transfer_ix(
    asset: Pubkey,
    collection_or_program: Pubkey,
    payer: Pubkey,
    authority: Pubkey,
    new_owner: Pubkey,
) -> Instruction {
    Instruction {
        program_id: MPL_CORE_PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(asset, false),
            AccountMeta::new_readonly(collection_or_program, false),
            AccountMeta::new(payer, true),
            AccountMeta::new_readonly(authority, true),
            AccountMeta::new_readonly(new_owner, false),
            AccountMeta::new_readonly(MPL_CORE_PROGRAM_ID, false),
            AccountMeta::new_readonly(MPL_CORE_PROGRAM_ID, false),
        ],
        data: vec![14, 0],
    }
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

#[account]
#[derive(InitSpace)]
pub struct AuctionConfig {
    pub admin: Pubkey,
    pub settler: Pubkey,
    pub fee_treasury: Pubkey,
    pub nusa_mint: Pubkey,
    pub fee_bps: u16,
    pub min_bid_increment: u64,
    pub min_starting_price: u64,
    pub min_duration_secs: i64,
    pub max_duration_secs: i64,
    pub anti_snipe_window_secs: i64,
    pub anti_snipe_extension_secs: i64,
    pub anti_snipe_max_extension_secs: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AuctionState {
    #[max_len(48)]
    pub auction_id: String,
    pub seller: Pubkey,
    pub card_mint: Pubkey,
    pub is_core_nft: bool,
    pub collection: Option<Pubkey>,
    pub starting_price: u64,
    pub current_highest_bid: u64,
    pub highest_bidder: Pubkey,
    pub bid_count: u32,
    pub created_at: i64,
    pub original_ends_at: i64,
    pub ends_at: i64,
    pub extended_secs: i64,
    pub status: AuctionStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BidEscrow {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
    pub last_bid_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AuctionStatus {
    Active,
    Settled,
    Expired,
    Cancelled,
}

#[error_code]
pub enum AuctionError {
    #[msg("Unauthorized signer.")]
    Unauthorized,
    #[msg("Invalid auction identifier.")]
    InvalidAuctionId,
    #[msg("Starting price must be a whole NUSA amount meeting minimum.")]
    InvalidStartingPrice,
    #[msg("Auction duration is outside allowed bounds (max 24 hours).")]
    InvalidDuration,
    #[msg("Fee basis points exceed allowed cap.")]
    InvalidFeeBps,
    #[msg("Auction is not active.")]
    AuctionNotActive,
    #[msg("Auction cannot be edited or cancelled after a bid is placed.")]
    AuctionAlreadyHasBids,
    #[msg("Auction has already ended.")]
    AuctionEnded,
    #[msg("Auction is still running.")]
    AuctionStillRunning,
    #[msg("Seller cannot bid on their own auction.")]
    SellerCannotBid,
    #[msg("You are already the highest bidder.")]
    AlreadyHighestBidder,
    #[msg("Bid amount must be a whole NUSA amount.")]
    InvalidBidAmount,
    #[msg("Bid must exceed the current price by at least the minimum increment (50 NUSA).")]
    BidTooLow,
    #[msg("Invalid asset standard for this instruction.")]
    InvalidAssetStandard,
    #[msg("Invalid NUSA mint address.")]
    InvalidNusaMint,
    #[msg("Invalid card mint or asset address.")]
    InvalidCardMint,
    #[msg("Invalid fee treasury wallet.")]
    InvalidTreasury,
    #[msg("Invalid seller wallet.")]
    InvalidSeller,
    #[msg("Invalid card recipient wallet.")]
    InvalidRecipient,
    #[msg("Invalid bid escrow account.")]
    InvalidBidEscrow,
    #[msg("Winning bidder cannot claim a losing-bid refund.")]
    WinnerCannotRefund,
    #[msg("No frozen NUSA balance to refund.")]
    NothingToRefund,
    #[msg("Arithmetic overflow.")]
    MathOverflow,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fee_split_charges_exact_ten_percent() {
        let (fee, payout) = calculate_fee_split(1_000_000_000, 1000).unwrap();
        assert_eq!(fee, 100_000_000);
        assert_eq!(payout, 900_000_000);
        assert_eq!(fee + payout, 1_000_000_000);
    }

    #[test]
    fn fee_split_handles_odd_amounts_without_loss() {
        let (fee, payout) = calculate_fee_split(155_000_000, 1000).unwrap();
        assert_eq!(fee, 15_500_000);
        assert_eq!(payout, 139_500_000);
        assert_eq!(fee + payout, 155_000_000);
    }
}
