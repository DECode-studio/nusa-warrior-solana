use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

use crate::constants::{MAX_AUCTION_ID_LEN, MPL_CORE_PROGRAM_ID, NUSA_WHOLE_UNIT};
use crate::errors::AuctionError;
use crate::state::AuctionConfig;

pub fn validate_auction_params(
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

pub fn calculate_fee_split(winning_bid: u64, fee_bps: u16) -> Result<(u64, u64)> {
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

pub fn build_mpl_core_transfer_ix(
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
