use anchor_lang::prelude::*;

pub const MPL_CORE_PROGRAM_ID: Pubkey =
    pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

pub const MAX_AUCTION_ID_LEN: usize = 48;
pub const NUSA_WHOLE_UNIT: u64 = 1_000_000;
pub const MAX_FEE_BPS: u16 = 5_000;
pub const MAX_DURATION_HARD_CAP_SECS: i64 = 86_400;
pub const ANTI_SNIPE_WINDOW_SECS: i64 = 300;
pub const ANTI_SNIPE_EXTENSION_SECS: i64 = 300;
pub const ANTI_SNIPE_MAX_EXTENSION_SECS: i64 = 1_800;
