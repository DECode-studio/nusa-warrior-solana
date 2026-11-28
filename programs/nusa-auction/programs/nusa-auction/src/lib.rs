use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::*;

declare_id!("CvZTfH3fqdR6StvxRoqjHxNsJtzwBQAwuHSX8J5RxFHk");

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
        instructions::config::handle_initialize_config(
            ctx,
            settler,
            fee_treasury,
            fee_bps,
            min_bid_increment,
            min_starting_price,
            min_duration_secs,
            max_duration_secs,
        )
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
        instructions::config::handle_update_config(
            ctx,
            new_admin,
            new_settler,
            new_fee_treasury,
            new_fee_bps,
            new_min_bid_increment,
            new_min_starting_price,
            new_min_duration_secs,
            new_max_duration_secs,
        )
    }

    pub fn create_auction_token_2022(
        ctx: Context<CreateAuctionToken2022>,
        auction_id: String,
        starting_price: u64,
        duration_secs: i64,
    ) -> Result<()> {
        instructions::create_auction::handle_create_auction_token_2022(
            ctx,
            auction_id,
            starting_price,
            duration_secs,
        )
    }

    pub fn create_auction_core_nft(
        ctx: Context<CreateAuctionCoreNft>,
        auction_id: String,
        starting_price: u64,
        duration_secs: i64,
    ) -> Result<()> {
        instructions::create_auction::handle_create_auction_core_nft(
            ctx,
            auction_id,
            starting_price,
            duration_secs,
        )
    }

    pub fn update_auction(
        ctx: Context<UpdateAuction>,
        auction_id: String,
        new_starting_price: u64,
        new_duration_secs: i64,
    ) -> Result<()> {
        instructions::manage_auction::handle_update_auction(
            ctx,
            auction_id,
            new_starting_price,
            new_duration_secs,
        )
    }

    pub fn cancel_auction_token_2022(
        ctx: Context<CancelAuctionToken2022>,
        auction_id: String,
    ) -> Result<()> {
        instructions::manage_auction::handle_cancel_auction_token_2022(ctx, auction_id)
    }

    pub fn cancel_auction_core_nft(
        ctx: Context<CancelAuctionCoreNft>,
        auction_id: String,
    ) -> Result<()> {
        instructions::manage_auction::handle_cancel_auction_core_nft(ctx, auction_id)
    }

    pub fn place_bid(
        ctx: Context<PlaceBid>,
        auction_id: String,
        new_bid_amount: u64,
    ) -> Result<()> {
        instructions::place_bid::handle_place_bid(ctx, auction_id, new_bid_amount)
    }

    pub fn settle_auction_token_2022(
        ctx: Context<SettleAuctionToken2022>,
        auction_id: String,
    ) -> Result<()> {
        instructions::settle_auction::handle_settle_auction_token_2022(ctx, auction_id)
    }

    pub fn settle_auction_core_nft(
        ctx: Context<SettleAuctionCoreNft>,
        auction_id: String,
    ) -> Result<()> {
        instructions::settle_auction::handle_settle_auction_core_nft(ctx, auction_id)
    }

    pub fn refund_losing_bid(
        ctx: Context<RefundLosingBid>,
        auction_id: String,
    ) -> Result<()> {
        instructions::refund_bid::handle_refund_losing_bid(ctx, auction_id)
    }
}
