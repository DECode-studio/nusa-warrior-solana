use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct BidEscrow {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
    pub last_bid_at: i64,
    pub bump: u8,
}
