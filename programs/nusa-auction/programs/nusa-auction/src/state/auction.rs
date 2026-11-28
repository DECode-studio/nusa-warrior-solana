use anchor_lang::prelude::*;

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AuctionStatus {
    Active,
    Settled,
    Expired,
    Cancelled,
}
