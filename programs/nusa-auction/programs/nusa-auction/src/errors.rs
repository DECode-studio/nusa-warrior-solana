use anchor_lang::prelude::*;

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
