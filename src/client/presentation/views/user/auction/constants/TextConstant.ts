import type { SupportedLocale } from "@/core/constants/routes";

export interface AuctionCopy {
  title: string;
  subtitle: string;
  createAuction: string;
  availableBalanceLabel: string;
  frozenBalanceLabel: string;
  activeListingsLabel: string;
  frozenBannerTitle: string;
  frozenBannerDescription: string;
  frozenHighestBadge: string;
  frozenOutbidBadge: string;
  frozenRefundReadyBadge: string;
  tabs: {
    explore: string;
    selling: string;
    bidding: string;
    history: string;
  };
  searchPlaceholder: string;
  allKingdoms: string;
  sortOptions: {
    ending_soon: string;
    price_asc: string;
    price_desc: string;
    most_bids: string;
    newest: string;
  };
  loadingText: string;
  emptyExploreTitle: string;
  emptyExploreDesc: string;
  emptySellingTitle: string;
  emptySellingDesc: string;
  emptyBiddingTitle: string;
  emptyBiddingDesc: string;
  emptyHistoryTitle: string;
  emptyHistoryDesc: string;
  startingPriceLabel: string;
  currentBidLabel: string;
  minNextBidLabel: string;
  bidsCountLabel: string;
  timeRemainingLabel: string;
  endedLabel: string;
  sellerLabel: string;
  highestBidderLabel: string;
  noBidsYet: string;
  viewDetail: string;
  placeBid: string;
  editAuction: string;
  cancelAuction: string;
  settleAuction: string;
  claimRefund: string;
  insufficientBalance: string;
  alreadyHighestBidder: string;
  sellerCannotBid: string;
  lockedEditReason: string;
  deckBlockedHint: string;
  feeInfoLabel: string;
  estimatedNetLabel: string;
  freezeWarning: string;
  antiSnipeNote: string;
  bidHistoryTitle: string;
  createModalTitle: string;
  editModalTitle: string;
  selectCardLabel: string;
  durationLabel: string;
  durationHint: string;
  submitCreate: string;
  submitEdit: string;
  cancelAction: string;
  walletRequired: string;
  goToShop: string;
  goToDecks: string;
}

const COPY_MAP: Record<SupportedLocale, AuctionCopy> = {
  id: {
    title: "Balai Lelang Kartu",
    subtitle:
      "Lelang kartu koleksi Anda secara on-chain di Solana. Minimal kenaikan bid +50 NUSA, dana bid dibekukan hingga lelang selesai, dan fee platform 10% hanya pada transaksi berhasil.",
    createAuction: "Lelang Kartu",
    availableBalanceLabel: "Saldo NUSA Tersedia",
    frozenBalanceLabel: "NUSA Dibekukan di Lelang",
    activeListingsLabel: "Lelang Aktif Anda",
    frozenBannerTitle: "Informasi Pembekuan NUSA",
    frozenBannerDescription:
      "NUSA yang Anda pertaruhkan pada bid aktif ditahan di smart contract escrow hingga jam lelang berakhir. Jika kalah, dana kembali 100% tanpa potongan.",
    frozenHighestBadge: "Penawar Tertinggi",
    frozenOutbidBadge: "Tersalip (Dana Ditahan)",
    frozenRefundReadyBadge: "Siap Dikembalikan",
    tabs: {
      explore: "Lelang Aktif",
      selling: "Lelang Saya",
      bidding: "Bid Saya",
      history: "Riwayat",
    },
    searchPlaceholder: "Cari nama kartu...",
    allKingdoms: "Semua Kerajaan",
    sortOptions: {
      ending_soon: "Segera Berakhir",
      price_asc: "Harga Terendah",
      price_desc: "Harga Tertinggi",
      most_bids: "Bid Terbanyak",
      newest: "Terbaru",
    },
    loadingText: "Memuat data lelang dan saldo NUSA on-chain...",
    emptyExploreTitle: "Belum ada lelang aktif",
    emptyExploreDesc:
      "Jadilah pemain pertama yang melelang kartu koleksi Anda di Balai Lelang.",
    emptySellingTitle: "Anda belum membuat lelang",
    emptySellingDesc:
      "Pilih kartu yang tidak sedang terpasang di deck untuk mulai melelang.",
    emptyBiddingTitle: "Anda belum mengikuti lelang mana pun",
    emptyBiddingDesc:
      "Jelajahi tab Lelang Aktif dan pasang bid minimal +50 NUSA untuk mulai menawar.",
    emptyHistoryTitle: "Belum ada riwayat lelang selesai",
    emptyHistoryDesc:
      "Lelang yang sudah selesai, kedaluwarsa, atau dibatalkan akan muncul di sini.",
    startingPriceLabel: "Harga Awal",
    currentBidLabel: "Bid Tertinggi",
    minNextBidLabel: "Bid Minimal Berikutnya",
    bidsCountLabel: "Penawaran",
    timeRemainingLabel: "Sisa Waktu",
    endedLabel: "Berakhir",
    sellerLabel: "Penjual",
    highestBidderLabel: "Penawar Tertinggi",
    noBidsYet: "Belum ada bid",
    viewDetail: "Lihat Detail",
    placeBid: "Pasang Bid",
    editAuction: "Edit Lelang",
    cancelAuction: "Hapus Lelang",
    settleAuction: "Selesaikan Lelang",
    claimRefund: "Klaim Refund NUSA",
    insufficientBalance: "Saldo NUSA Anda tidak mencukupi untuk nominal bid ini.",
    alreadyHighestBidder:
      "Anda sudah menjadi penawar tertinggi saat ini. Tunggu peserta lain menyalip sebelum menaikkan bid.",
    sellerCannotBid: "Anda tidak dapat menawar kartu lelang milik sendiri.",
    lockedEditReason:
      "Edit dan hapus lelang terkunci karena sudah ada peserta yang melakukan bid.",
    deckBlockedHint:
      "Kartu yang sedang dipakai di Deck tidak dapat dilelang sebelum dikeluarkan dari Deck.",
    feeInfoLabel: "Fee Platform (10%)",
    estimatedNetLabel: "Estimasi Bersih Penjual (90%)",
    freezeWarning:
      "NUSA sebesar kebutuhan bid akan langsung dipotong dan dibekukan di smart contract hingga lelang selesai. Jika kalah, dana kembali 100%.",
    antiSnipeNote:
      "Anti-Sniping aktif: bid pada 5 menit terakhir memperpanjang waktu lelang +5 menit (maks +30 menit).",
    bidHistoryTitle: "Riwayat Penawaran",
    createModalTitle: "Buat Lelang Kartu Baru",
    editModalTitle: "Edit Lelang Kartu",
    selectCardLabel: "Pilih Kartu dari Dompet",
    durationLabel: "Durasi Lelang (Jam)",
    durationHint: "Minimal 1 jam, maksimal 24 jam (1 hari).",
    submitCreate: "Posting Lelang (Sign Wallet)",
    submitEdit: "Simpan Perubahan (Sign Wallet)",
    cancelAction: "Tutup",
    walletRequired:
      "Hubungkan dompet Solana terlebih dahulu untuk membuat lelang atau memasang bid.",
    goToShop: "Isi Saldo NUSA",
    goToDecks: "Atur Deck",
  },
  en: {
    title: "Card Auction House",
    subtitle:
      "Auction your collectible cards on-chain on Solana. Minimum +50 NUSA increment, bid deposits frozen until auction end, and 10% platform fee on successful sales.",
    createAuction: "List Card",
    availableBalanceLabel: "Available NUSA Balance",
    frozenBalanceLabel: "Frozen NUSA in Auctions",
    activeListingsLabel: "Your Active Auctions",
    frozenBannerTitle: "Frozen NUSA Escrow Summary",
    frozenBannerDescription:
      "NUSA committed to active bids is held in the smart contract escrow until the auction ends. Losing bids receive a 100% refund with zero fee.",
    frozenHighestBadge: "Highest Bidder",
    frozenOutbidBadge: "Outbid (Funds Held)",
    frozenRefundReadyBadge: "Refund Available",
    tabs: {
      explore: "Active Auctions",
      selling: "My Listings",
      bidding: "My Bids",
      history: "History",
    },
    searchPlaceholder: "Search card name...",
    allKingdoms: "All Kingdoms",
    sortOptions: {
      ending_soon: "Ending Soon",
      price_asc: "Lowest Price",
      price_desc: "Highest Price",
      most_bids: "Most Bids",
      newest: "Newest",
    },
    loadingText: "Loading auctions and on-chain NUSA balance...",
    emptyExploreTitle: "No active auctions yet",
    emptyExploreDesc:
      "Be the first player to list a card from your wallet in the Auction House.",
    emptySellingTitle: "You have no auction listings",
    emptySellingDesc:
      "Pick a card not currently assigned to any deck to start an auction.",
    emptyBiddingTitle: "You have not placed any bids",
    emptyBiddingDesc:
      "Browse Active Auctions and place a bid of at least +50 NUSA.",
    emptyHistoryTitle: "No completed auctions yet",
    emptyHistoryDesc:
      "Settled, expired, and cancelled auctions will appear here.",
    startingPriceLabel: "Starting Price",
    currentBidLabel: "Highest Bid",
    minNextBidLabel: "Minimum Next Bid",
    bidsCountLabel: "Bids",
    timeRemainingLabel: "Time Left",
    endedLabel: "Ended",
    sellerLabel: "Seller",
    highestBidderLabel: "Highest Bidder",
    noBidsYet: "No bids yet",
    viewDetail: "View Details",
    placeBid: "Place Bid",
    editAuction: "Edit Auction",
    cancelAuction: "Delete Auction",
    settleAuction: "Settle Auction",
    claimRefund: "Claim NUSA Refund",
    insufficientBalance: "Insufficient NUSA balance for this bid amount.",
    alreadyHighestBidder:
      "You are already the highest bidder. Wait for another bidder before raising.",
    sellerCannotBid: "You cannot bid on your own auction.",
    lockedEditReason:
      "Editing and deleting are locked once at least one bid has been placed.",
    deckBlockedHint:
      "Cards currently assigned to a Deck must be removed from the Deck before auctioning.",
    feeInfoLabel: "Platform Fee (10%)",
    estimatedNetLabel: "Estimated Seller Payout (90%)",
    freezeWarning:
      "Required NUSA is immediately deducted and frozen in the smart contract until the auction ends. Losing bids are refunded 100%.",
    antiSnipeNote:
      "Anti-Sniping active: bids within the final 5 minutes extend the auction by +5 minutes (max +30 minutes).",
    bidHistoryTitle: "Bid History",
    createModalTitle: "Create Card Auction",
    editModalTitle: "Edit Card Auction",
    selectCardLabel: "Select Card from Wallet",
    durationLabel: "Auction Duration (Hours)",
    durationHint: "Minimum 1 hour, maximum 24 hours (1 day).",
    submitCreate: "Post Auction (Sign Wallet)",
    submitEdit: "Save Changes (Sign Wallet)",
    cancelAction: "Close",
    walletRequired:
      "Connect your Solana wallet first to create an auction or place a bid.",
    goToShop: "Get NUSA",
    goToDecks: "Manage Decks",
  },
  zh: {
    title: "卡牌拍卖行",
    subtitle:
      "在 Solana 链上拍卖您的收藏卡牌。每次加价至少 +50 NUSA，出价资金将冻结至拍卖结束，仅在成交时收取 10% 平台手续费。",
    createAuction: "发布拍卖",
    availableBalanceLabel: "可用 NUSA 余额",
    frozenBalanceLabel: "拍卖冻结中的 NUSA",
    activeListingsLabel: "我的进行中拍卖",
    frozenBannerTitle: "NUSA 冻结托管说明",
    frozenBannerDescription:
      "您在活跃拍卖中出价的 NUSA 将锁定在智能合约托管账户中，直至拍卖结束。未中标出价将全额 100% 退还。",
    frozenHighestBadge: "当前最高出价",
    frozenOutbidBadge: "已被超越（资金冻结中）",
    frozenRefundReadyBadge: "可领取退款",
    tabs: {
      explore: "进行中拍卖",
      selling: "我的拍卖",
      bidding: "我的出价",
      history: "历史记录",
    },
    searchPlaceholder: "搜索卡牌名称...",
    allKingdoms: "所有王国",
    sortOptions: {
      ending_soon: "即将结束",
      price_asc: "价格最低",
      price_desc: "价格最高",
      most_bids: "出价最多",
      newest: "最新发布",
    },
    loadingText: "正在加载拍卖列表与链上 NUSA 余额...",
    emptyExploreTitle: "暂无进行中的拍卖",
    emptyExploreDesc: "成为第一位在拍卖行上架卡牌的玩家。",
    emptySellingTitle: "您尚未发布拍卖",
    emptySellingDesc: "选择一张未编入卡组的卡牌开始拍卖。",
    emptyBiddingTitle: "您尚未参与任何出价",
    emptyBiddingDesc: "浏览进行中的拍卖并出价（至少 +50 NUSA）。",
    emptyHistoryTitle: "暂无已结束的拍卖记录",
    emptyHistoryDesc: "已结算、已过期或已取消的拍卖会显示在这里。",
    startingPriceLabel: "起拍价",
    currentBidLabel: "当前最高价",
    minNextBidLabel: "最低下一次出价",
    bidsCountLabel: "出价次数",
    timeRemainingLabel: "剩余时间",
    endedLabel: "已结束",
    sellerLabel: "卖家",
    highestBidderLabel: "最高出价者",
    noBidsYet: "暂无出价",
    viewDetail: "查看详情",
    placeBid: "立即出价",
    editAuction: "编辑拍卖",
    cancelAuction: "取消拍卖",
    settleAuction: "结算拍卖",
    claimRefund: "领取 NUSA 退款",
    insufficientBalance: "您的 NUSA 余额不足以完成本次出价。",
    alreadyHighestBidder: "您已是当前最高出价者，请等待其他玩家出价后再加价。",
    sellerCannotBid: "卖家不能对自己的拍卖出价。",
    lockedEditReason: "已有玩家出价后，无法编辑或取消拍卖。",
    deckBlockedHint: "已编入卡组的卡牌需先移出卡组后方可拍卖。",
    feeInfoLabel: "平台手续费 (10%)",
    estimatedNetLabel: "预计卖家实得 (90%)",
    freezeWarning:
      "本次所需 NUSA 将立即扣除并冻结于智能合约中直至拍卖结束。未中标将全额 100% 退还。",
    antiSnipeNote:
      "防狙击机制：最后 5 分钟内出价将自动延长 5 分钟（最多延长 30 分钟）。",
    bidHistoryTitle: "出价记录",
    createModalTitle: "发布卡牌拍卖",
    editModalTitle: "编辑卡牌拍卖",
    selectCardLabel: "从钱包选择卡牌",
    durationLabel: "拍卖时长（小时）",
    durationHint: "最短 1 小时，最长 24 小时（1 天）。",
    submitCreate: "发布拍卖（钱包签名）",
    submitEdit: "保存修改（钱包签名）",
    cancelAction: "关闭",
    walletRequired: "请先连接您的 Solana 钱包以发布拍卖或参与出价。",
    goToShop: "获取 NUSA",
    goToDecks: "管理卡组",
  },
};

export function getAuctionCopy(locale: SupportedLocale): AuctionCopy {
  return COPY_MAP[locale] ?? COPY_MAP.id;
}
