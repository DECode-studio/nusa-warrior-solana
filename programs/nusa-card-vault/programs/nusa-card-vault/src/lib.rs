use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

declare_id!("GWbea8uHeLSiMKwuL8UDeBhg3k83v6QnKwswiTCmJ6GU");

pub const MPL_CORE_PROGRAM_ID: Pubkey =
    pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const MAX_MATCH_ID_LEN: usize = 48;

#[program]
pub mod nusa_card_vault {
    use super::*;

    /// Initializes the global vault configuration with admin and settler authorities.
    pub fn initialize_config(ctx: Context<InitializeConfig>, settler: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.settler = settler;
        config.vault_authority_bump = ctx.bumps.vault_authority;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Updates admin or settler authority (admin only).
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_admin: Option<Pubkey>,
        new_settler: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        if let Some(admin) = new_admin {
            config.admin = admin;
        }
        if let Some(settler) = new_settler {
            config.settler = settler;
        }
        Ok(())
    }

    /// Creates a battle vault for a Quick Match PvP or League match.
    pub fn create_battle_vault(
        ctx: Context<CreateBattleVault>,
        match_id: String,
        player_a: Pubkey,
        player_b: Pubkey,
        expires_at: i64,
    ) -> Result<()> {
        require!(
            !match_id.is_empty() && match_id.len() <= MAX_MATCH_ID_LEN,
            VaultError::InvalidMatchId
        );
        require!(player_a != player_b, VaultError::SamePlayer);

        let now = Clock::get()?.unix_timestamp;
        require!(expires_at > now, VaultError::InvalidExpiry);

        let vault = &mut ctx.accounts.battle_vault;
        vault.match_id = match_id;
        vault.player_a = player_a;
        vault.player_b = player_b;
        vault.status = VaultStatus::Active;
        vault.created_at = now;
        vault.expires_at = expires_at;
        vault.player_a_locked_count = 0;
        vault.player_b_locked_count = 0;
        vault.bump = ctx.bumps.battle_vault;
        Ok(())
    }

    /// Locks a Token-2022 regular card (quantity >= 1) from player's ATA into the persistent vault ATA.
    pub fn lock_token_2022_card(
        ctx: Context<LockToken2022Card>,
        _match_id: String,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        let vault = &mut ctx.accounts.battle_vault;
        require!(vault.status == VaultStatus::Active, VaultError::VaultNotActive);

        let owner_key = ctx.accounts.owner.key();
        require!(
            owner_key == vault.player_a || owner_key == vault.player_b,
            VaultError::NotMatchParticipant
        );

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.owner_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        let deposit = &mut ctx.accounts.vault_deposit;
        if deposit.amount == 0 {
            deposit.battle_vault = vault.key();
            deposit.owner = owner_key;
            deposit.mint = ctx.accounts.mint.key();
            deposit.is_core_nft = false;
            deposit.bump = ctx.bumps.vault_deposit;
        }
        deposit.amount = deposit
            .amount
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;

        let count_u16 = u16::try_from(amount).map_err(|_| VaultError::MathOverflow)?;
        if owner_key == vault.player_a {
            vault.player_a_locked_count = vault
                .player_a_locked_count
                .checked_add(count_u16)
                .ok_or(VaultError::MathOverflow)?;
        } else {
            vault.player_b_locked_count = vault
                .player_b_locked_count
                .checked_add(count_u16)
                .ok_or(VaultError::MathOverflow)?;
        }

        Ok(())
    }

    /// Locks a Metaplex Core 1/1 NFT card (Custom Forge or Rare Edition) into the vault authority PDA.
    pub fn lock_core_card(ctx: Context<LockCoreCard>, _match_id: String) -> Result<()> {
        let vault = &mut ctx.accounts.battle_vault;
        require!(vault.status == VaultStatus::Active, VaultError::VaultNotActive);

        let owner_key = ctx.accounts.owner.key();
        require!(
            owner_key == vault.player_a || owner_key == vault.player_b,
            VaultError::NotMatchParticipant
        );

        let collection_key = ctx
            .accounts
            .collection
            .as_ref()
            .map(|c| c.key())
            .unwrap_or(MPL_CORE_PROGRAM_ID);

        let ix = build_mpl_core_transfer_ix(
            ctx.accounts.asset.key(),
            collection_key,
            ctx.accounts.owner.key(),
            ctx.accounts.owner.key(),
            ctx.accounts.vault_authority.key(),
        );

        let mut account_infos = vec![
            ctx.accounts.asset.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.vault_authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.mpl_core_program.to_account_info(),
        ];
        if let Some(collection) = ctx.accounts.collection.as_ref() {
            account_infos.push(collection.to_account_info());
        }
        invoke(&ix, &account_infos)?;

        let deposit = &mut ctx.accounts.vault_deposit;
        deposit.battle_vault = vault.key();
        deposit.owner = owner_key;
        deposit.mint = ctx.accounts.asset.key();
        deposit.amount = 1;
        deposit.is_core_nft = true;
        deposit.bump = ctx.bumps.vault_deposit;

        if owner_key == vault.player_a {
            vault.player_a_locked_count = vault
                .player_a_locked_count
                .checked_add(1)
                .ok_or(VaultError::MathOverflow)?;
        } else {
            vault.player_b_locked_count = vault
                .player_b_locked_count
                .checked_add(1)
                .ok_or(VaultError::MathOverflow)?;
        }

        Ok(())
    }

    /// Settler/Admin override: transfers 1 reward Token-2022 card from loser's deposit to winner.
    pub fn settle_token_2022_reward(
        ctx: Context<SettleToken2022Reward>,
        _match_id: String,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.battle_vault;
        require!(
            vault.status == VaultStatus::Active || vault.status == VaultStatus::SettledWin,
            VaultError::VaultAlreadySettled
        );

        let deposit = &mut ctx.accounts.loser_deposit;
        require!(!deposit.is_core_nft, VaultError::InvalidAssetStandard);
        require!(deposit.amount >= 1, VaultError::InsufficientDeposit);

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault_authority",
            &[ctx.accounts.config.vault_authority_bump],
        ]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.winner_ata.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                signer_seeds,
            ),
            1,
            ctx.accounts.mint.decimals,
        )?;

        deposit.amount -= 1;
        vault.status = VaultStatus::SettledWin;
        Ok(())
    }

    /// Settler/Admin override: transfers 1 reward Metaplex Core NFT from loser's deposit to winner.
    pub fn settle_core_reward(ctx: Context<SettleCoreReward>, _match_id: String) -> Result<()> {
        let vault = &mut ctx.accounts.battle_vault;
        require!(
            vault.status == VaultStatus::Active || vault.status == VaultStatus::SettledWin,
            VaultError::VaultAlreadySettled
        );

        let deposit = &mut ctx.accounts.loser_deposit;
        require!(deposit.is_core_nft, VaultError::InvalidAssetStandard);
        require!(deposit.amount == 1, VaultError::InsufficientDeposit);

        let collection_key = ctx
            .accounts
            .collection
            .as_ref()
            .map(|c| c.key())
            .unwrap_or(MPL_CORE_PROGRAM_ID);

        let ix = build_mpl_core_transfer_ix(
            ctx.accounts.asset.key(),
            collection_key,
            ctx.accounts.authority.key(),
            ctx.accounts.vault_authority.key(),
            ctx.accounts.winner.key(),
        );

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"vault_authority",
            &[ctx.accounts.config.vault_authority_bump],
        ]];

        let mut account_infos = vec![
            ctx.accounts.asset.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.vault_authority.to_account_info(),
            ctx.accounts.winner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.mpl_core_program.to_account_info(),
        ];
        if let Some(collection) = ctx.accounts.collection.as_ref() {
            account_infos.push(collection.to_account_info());
        }
        invoke_signed(&ix, &account_infos, signer_seeds)?;

        deposit.amount = 0;
        vault.status = VaultStatus::SettledWin;
        Ok(())
    }

    /// Settler/Admin marks a match as Draw (e.g. both players disconnected for 5 minutes).
    pub fn mark_battle_draw(ctx: Context<MarkBattleDraw>, _match_id: String) -> Result<()> {
        let vault = &mut ctx.accounts.battle_vault;
        require!(vault.status == VaultStatus::Active, VaultError::VaultNotActive);
        vault.status = VaultStatus::SettledDraw;
        Ok(())
    }

    /// Releases remaining locked Token-2022 cards back to the owner after settlement or expiry.
    pub fn release_token_2022_card(
        ctx: Context<ReleaseToken2022Card>,
        _match_id: String,
    ) -> Result<()> {
        let vault = &ctx.accounts.battle_vault;
        let now = Clock::get()?.unix_timestamp;
        let is_settled = vault.status == VaultStatus::SettledWin
            || vault.status == VaultStatus::SettledDraw
            || vault.status == VaultStatus::Cancelled;
        let is_expired = now > vault.expires_at;
        require!(is_settled || is_expired, VaultError::VaultStillLocked);

        let deposit = &ctx.accounts.vault_deposit;
        require!(!deposit.is_core_nft, VaultError::InvalidAssetStandard);

        if deposit.amount > 0 {
            let signer_seeds: &[&[&[u8]]] = &[&[
                b"vault_authority",
                &[ctx.accounts.config.vault_authority_bump],
            ]];

            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault_ata.to_account_info(),
                        mint: ctx.accounts.mint.to_account_info(),
                        to: ctx.accounts.owner_ata.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                deposit.amount,
                ctx.accounts.mint.decimals,
            )?;
        }

        Ok(())
    }

    /// Releases a locked Metaplex Core NFT back to the owner after settlement or expiry.
    pub fn release_core_card(ctx: Context<ReleaseCoreCard>, _match_id: String) -> Result<()> {
        let vault = &ctx.accounts.battle_vault;
        let now = Clock::get()?.unix_timestamp;
        let is_settled = vault.status == VaultStatus::SettledWin
            || vault.status == VaultStatus::SettledDraw
            || vault.status == VaultStatus::Cancelled;
        let is_expired = now > vault.expires_at;
        require!(is_settled || is_expired, VaultError::VaultStillLocked);

        let deposit = &ctx.accounts.vault_deposit;
        require!(deposit.is_core_nft, VaultError::InvalidAssetStandard);

        if deposit.amount == 1 {
            let collection_key = ctx
                .accounts
                .collection
                .as_ref()
                .map(|c| c.key())
                .unwrap_or(MPL_CORE_PROGRAM_ID);

            let ix = build_mpl_core_transfer_ix(
                ctx.accounts.asset.key(),
                collection_key,
                ctx.accounts.payer.key(),
                ctx.accounts.vault_authority.key(),
                ctx.accounts.owner.key(),
            );

            let signer_seeds: &[&[&[u8]]] = &[&[
                b"vault_authority",
                &[ctx.accounts.config.vault_authority_bump],
            ]];

            let mut account_infos = vec![
                ctx.accounts.asset.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.vault_authority.to_account_info(),
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.mpl_core_program.to_account_info(),
            ];
            if let Some(collection) = ctx.accounts.collection.as_ref() {
                account_infos.push(collection.to_account_info());
            }
            invoke_signed(&ix, &account_infos, signer_seeds)?;
        }

        Ok(())
    }
}

/// Builds a Metaplex Core `TransferV1` instruction (discriminator = 14, compression_proof = None).
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
        // 14 = TransferV1, 0 = Option::None for compression_proof
        data: vec![14, 0],
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + VaultConfig::INIT_SPACE,
        seeds = [b"vault_config"],
        bump
    )]
    pub config: Account<'info, VaultConfig>,
    /// CHECK: PDA used as persistent authority over vaulted tokens and Core assets.
    #[account(seeds = [b"vault_authority"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault_config"],
        bump = config.bump,
        has_one = admin @ VaultError::Unauthorized
    )]
    pub config: Account<'info, VaultConfig>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct CreateBattleVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub settler: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
        constraint = settler.key() == config.settler || settler.key() == config.admin @ VaultError::Unauthorized
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        init,
        payer = payer,
        space = 8 + BattleVault::INIT_SPACE,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct LockToken2022Card<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority owning persistent vault ATAs.
    #[account(seeds = [b"vault_authority"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program
    )]
    pub owner_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program
    )]
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + VaultDeposit::INIT_SPACE,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            owner.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub vault_deposit: Account<'info, VaultDeposit>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct LockCoreCard<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority holding vaulted Core assets.
    #[account(seeds = [b"vault_authority"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    /// CHECK: Metaplex Core asset account, validated by mpl-core CPI.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    #[account(
        init,
        payer = owner,
        space = 8 + VaultDeposit::INIT_SPACE,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            owner.key().as_ref(),
            asset.key().as_ref()
        ],
        bump
    )]
    pub vault_deposit: Account<'info, VaultDeposit>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct SettleToken2022Reward<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
        constraint = authority.key() == config.settler || authority.key() == config.admin @ VaultError::Unauthorized
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        mut,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority owning persistent vault ATAs.
    #[account(seeds = [b"vault_authority"], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    /// CHECK: Winner wallet receiving the reward card.
    pub winner: UncheckedAccount<'info>,
    /// CHECK: Loser wallet whose deposited card is forfeited.
    pub loser: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program
    )]
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = winner,
        associated_token::token_program = token_program
    )]
    pub winner_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            loser.key().as_ref(),
            mint.key().as_ref()
        ],
        bump = loser_deposit.bump
    )]
    pub loser_deposit: Account<'info, VaultDeposit>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct SettleCoreReward<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
        constraint = authority.key() == config.settler || authority.key() == config.admin @ VaultError::Unauthorized
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        mut,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority holding vaulted Core assets.
    #[account(seeds = [b"vault_authority"], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    /// CHECK: Winner wallet receiving the reward NFT.
    pub winner: UncheckedAccount<'info>,
    /// CHECK: Loser wallet whose deposited NFT is forfeited.
    pub loser: UncheckedAccount<'info>,
    /// CHECK: Metaplex Core asset account.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    #[account(
        mut,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            loser.key().as_ref(),
            asset.key().as_ref()
        ],
        bump = loser_deposit.bump
    )]
    pub loser_deposit: Account<'info, VaultDeposit>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct MarkBattleDraw<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump,
        constraint = authority.key() == config.settler || authority.key() == config.admin @ VaultError::Unauthorized
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        mut,
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct ReleaseToken2022Card<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority owning persistent vault ATAs.
    #[account(seeds = [b"vault_authority"], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    /// CHECK: Original card owner receiving their locked card back.
    #[account(mut)]
    pub owner: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program
    )]
    pub vault_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program
    )]
    pub owner_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        close = owner,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            owner.key().as_ref(),
            mint.key().as_ref()
        ],
        bump = vault_deposit.bump
    )]
    pub vault_deposit: Account<'info, VaultDeposit>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct ReleaseCoreCard<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"vault_config"],
        bump = config.bump
    )]
    pub config: Account<'info, VaultConfig>,
    #[account(
        seeds = [b"battle_vault", match_id.as_bytes()],
        bump = battle_vault.bump
    )]
    pub battle_vault: Account<'info, BattleVault>,
    /// CHECK: PDA authority holding vaulted Core assets.
    #[account(seeds = [b"vault_authority"], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    /// CHECK: Original card owner receiving their locked Core NFT back.
    #[account(mut)]
    pub owner: UncheckedAccount<'info>,
    /// CHECK: Metaplex Core asset account.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,
    /// CHECK: Optional Metaplex Core collection account.
    pub collection: Option<UncheckedAccount<'info>>,
    #[account(
        mut,
        close = owner,
        seeds = [
            b"vault_deposit",
            battle_vault.key().as_ref(),
            owner.key().as_ref(),
            asset.key().as_ref()
        ],
        bump = vault_deposit.bump
    )]
    pub vault_deposit: Account<'info, VaultDeposit>,
    /// CHECK: Metaplex Core program ID.
    #[account(address = MPL_CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultConfig {
    pub admin: Pubkey,
    pub settler: Pubkey,
    pub vault_authority_bump: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BattleVault {
    #[max_len(48)]
    pub match_id: String,
    pub player_a: Pubkey,
    pub player_b: Pubkey,
    pub status: VaultStatus,
    pub created_at: i64,
    pub expires_at: i64,
    pub player_a_locked_count: u16,
    pub player_b_locked_count: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VaultDeposit {
    pub battle_vault: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub is_core_nft: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VaultStatus {
    Active,
    SettledWin,
    SettledDraw,
    Cancelled,
}

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized caller.")]
    Unauthorized,
    #[msg("Invalid match ID.")]
    InvalidMatchId,
    #[msg("Players must be distinct.")]
    SamePlayer,
    #[msg("Expiry timestamp must be in the future.")]
    InvalidExpiry,
    #[msg("Vault is not active.")]
    VaultNotActive,
    #[msg("Vault is already settled.")]
    VaultAlreadySettled,
    #[msg("Vault is still locked until battle settles or expires.")]
    VaultStillLocked,
    #[msg("Signer is not a participant of this match.")]
    NotMatchParticipant,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Insufficient locked card deposit.")]
    InsufficientDeposit,
    #[msg("Asset standard mismatch.")]
    InvalidAssetStandard,
    #[msg("Arithmetic overflow.")]
    MathOverflow,
}
