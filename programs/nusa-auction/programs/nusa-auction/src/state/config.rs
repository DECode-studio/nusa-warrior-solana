use anchor_lang::prelude::*;

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
