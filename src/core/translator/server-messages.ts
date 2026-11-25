import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@/core/constants/routes";

export type ServerMessageValues = Record<string, string | number>;

export interface LocalizedServerMessage {
  messageKey: string;
  message: string;
  messageParams?: ServerMessageValues;
}

const TRANSLATIONS: Record<string, { id?: string; en: string; zh: string }> = {
  "Silakan masuk dengan Google untuk melanjutkan.": { en: "Sign in with Google to continue.", zh: "请使用 Google 登录以继续。" },
  "Akses ini hanya tersedia untuk akun pemain.": { en: "This area is only available to player accounts.", zh: "此功能仅对玩家账户开放。" },
  "Silakan masuk sebagai admin untuk melanjutkan.": { en: "Sign in as an administrator to continue.", zh: "请以管理员身份登录以继续。" },
  "Akses ini hanya tersedia untuk admin.": { en: "This area is only available to administrators.", zh: "此功能仅对管理员开放。" },
  "Permintaan lintas origin tidak diizinkan.": { en: "Cross-origin requests are not allowed.", zh: "不允许跨源请求。" },
  "Ukuran request terlalu besar.": { en: "The request is too large.", zh: "请求内容过大。" },
  "Body harus berupa JSON yang valid.": { en: "The request body must be valid JSON.", zh: "请求正文必须是有效的 JSON。" },
  "Input permintaan tidak valid.": { en: "The request contains invalid input.", zh: "请求内容无效。" },
  "Deck tidak ditemukan atau bukan milik Anda.": { en: "Deck not found or you do not own it.", zh: "未找到卡组，或该卡组不属于您。" },
  "Deck harus memiliki antara 1 hingga 10 kartu karakter aktif.": { en: "A deck must contain 1 to 10 active character cards.", zh: "卡组必须包含 1 至 10 张启用的角色卡。" },
  "Daftar instrumen deck tidak valid.": { en: "The deck's instrument list is invalid.", zh: "卡组中的乐器列表无效。" },
  "Katalog kartu belum cukup untuk membuat match.": { en: "There are not enough cards in the catalog to create a match.", zh: "卡牌目录中的卡牌不足，无法创建对局。" },
  "Deck quick match harus memiliki 1 sampai 10 kartu karakter aktif.": { en: "A quick-match deck must contain 1 to 10 active character cards.", zh: "快速匹配卡组必须包含 1 至 10 张启用的角色卡。" },
  "Daftar instrumen deck quick match tidak valid.": { en: "The quick-match deck's instrument list is invalid.", zh: "快速匹配卡组中的乐器列表无效。" },
  "Deck salah satu pemain tidak lagi tersedia.": { en: "One player's deck is no longer available.", zh: "其中一名玩家的卡组已不可用。" },
  "Persetujuan taruhan kartu diperlukan.": { en: "You must agree to the card stake.", zh: "您必须同意卡牌下注。" },
  "Antrean quick match tidak dapat dibuat.": { en: "Could not create the quick-match queue.", zh: "无法创建快速匹配队列。" },
  "Pertandingan quick match sebelumnya sudah selesai. Mulai pencarian baru.": { en: "The previous quick match has ended. Start a new search.", zh: "上一场快速匹配已结束。请重新开始搜索。" },
  "Selesaikan pertandingan aktif sebelum mencari quick match.": { en: "Finish your active match before searching for a quick match.", zh: "请先结束当前对局，再搜索快速匹配。" },
  "Match tidak ditemukan.": { en: "Match not found.", zh: "未找到对局。" },
  "Masa reconnect pertandingan telah berakhir.": { en: "The match reconnection period has expired.", zh: "对局的重新连接期限已过。" },
  "Dadu hanya dapat dilempar saat fase awal.": { en: "Dice can only be rolled during the opening phase.", zh: "只能在开局阶段掷骰子。" },
  "Hanya pemain yang mendapat giliran yang dapat memulai lemparan dadu.": { en: "Only the player whose turn it is can roll the dice.", zh: "只有当前回合的玩家可以掷骰子。" },
  "Instrumen tidak dapat dimainkan pada fase ini.": { en: "An instrument cannot be played during this phase.", zh: "此阶段不能使用乐器。" },
  "Target kartu tidak valid.": { en: "The selected card target is invalid.", zh: "所选卡牌目标无效。" },
  "Instrumen defensif harus dipasang pada karakter yang diserang.": { en: "A defensive instrument must be assigned to the attacked character.", zh: "防御乐器必须装备给受到攻击的角色。" },
  "Instrumen atau target tidak tersedia.": { en: "The instrument or target is unavailable.", zh: "该乐器或目标不可用。" },
  "Serangan tidak dapat dilakukan pada fase ini.": { en: "An attack cannot be made during this phase.", zh: "此阶段不能发起攻击。" },
  "Slot serangan tidak valid.": { en: "The selected attack slot is invalid.", zh: "所选攻击位置无效。" },
  "Penyerang atau target tidak valid.": { en: "The attacker or target is invalid.", zh: "攻击者或目标无效。" },
  "Tidak ada respons pertahanan yang menunggu.": { en: "There is no pending defense response.", zh: "当前没有待处理的防御响应。" },
  "Bentrok belum siap dilanjutkan.": { en: "The clash is not ready to continue.", zh: "交锋尚未准备好继续。" },
  "Tidak ada promosi pemain yang menunggu.": { en: "There is no pending player promotion.", zh: "当前没有待处理的玩家晋升操作。" },
  "Slot promosi tidak valid.": { en: "The selected promotion slot is invalid.", zh: "所选晋升位置无效。" },
  "Karakter promosi tidak tersedia.": { en: "The character selected for promotion is unavailable.", zh: "所选晋升角色不可用。" },
  "Giliran tidak dapat diakhiri pada fase ini.": { en: "The turn cannot end during this phase.", zh: "此阶段不能结束回合。" },
  "Instrumen tidak dapat dibuang pada fase ini.": { en: "An instrument cannot be discarded during this phase.", zh: "此阶段不能弃置乐器。" },
  "Instrumen tidak tersedia di tangan.": { en: "That instrument is not in your hand.", zh: "手牌中没有该乐器。" },
  "State match sudah berubah. Muat state terbaru sebelum mengirim aksi.": { en: "The match has changed. Reload the latest state before sending an action.", zh: "对局状态已更改。请先加载最新状态再提交操作。" },
  "Waktu pertandingan habis.": { en: "The match has timed out.", zh: "对局已超时。" },
  "Bentrok hanya dapat dilanjutkan oleh pemain yang sedang bertahan.": { en: "Only the defending player can continue the clash.", zh: "只有防守方玩家可以继续交锋。" },
  "Aksi bersamaan sudah memperbarui match. Muat state terbaru.": { en: "Another action updated the match. Reload the latest state.", zh: "另一项操作已更新对局。请加载最新状态。" },
  "Anda masih memiliki pertandingan aktif.": { en: "You already have an active match.", zh: "您已有一场进行中的对局。" },
  "Anda sudah berada dalam antrean quick match.": { en: "You are already in the quick-match queue.", zh: "您已在快速匹配队列中。" },
  "Kunci idempotensi sudah digunakan.": { en: "This idempotency key has already been used.", zh: "此幂等键已被使用。" },
  "Peserta quick match tidak valid.": { en: "The quick-match participant is invalid.", zh: "快速匹配参与者无效。" },
  "Kartu hadiah sudah tidak dimiliki pemain yang kalah.": { en: "The losing player no longer owns the reward card.", zh: "失败玩家已不再持有奖励卡。" },
  "Deck dan kartu tidak dapat diubah selama quick match aktif atau masih dalam antrean.": { en: "Decks and cards cannot be changed while a quick match is active or queued.", zh: "快速匹配进行中或排队时，不能更改卡组和卡牌。" },
  "Kartu escrow tidak ditemukan.": { en: "Escrow card not found.", zh: "未找到托管卡牌。" },
  "Escrow sudah diselesaikan.": { en: "This escrow has already been completed.", zh: "此托管已完成。" },
  "Escrow sedang diselesaikan oleh request lain.": { en: "Another request is completing this escrow.", zh: "另一项请求正在完成此托管。" },
  "Akun Google harus memiliki alamat email terverifikasi untuk masuk.": { en: "Your Google account must have a verified email address to sign in.", zh: "Google 账户必须拥有已验证的电子邮件地址才能登录。" },
  "Akun admin tidak dapat masuk menggunakan Google SSO. Gunakan username dan password admin.": { en: "Administrators cannot sign in with Google SSO. Use the admin username and password.", zh: "管理员不能使用 Google SSO 登录。请使用管理员用户名和密码。" },
  "Sesi akun tamu tidak ditemukan atau telah kedaluwarsa.": { en: "The guest account session was not found or has expired.", zh: "未找到访客账户会话，或该会话已过期。" },
  "Akun saat ini bukan akun tamu.": { en: "The current account is not a guest account.", zh: "当前账户不是访客账户。" },
  "Username atau kata sandi tidak sesuai.": { en: "The username or password is incorrect.", zh: "用户名或密码不正确。" },
  "Akun pengguna tidak ditemukan.": { en: "User account not found.", zh: "未找到用户账户。" },
  "Pengguna tidak ditemukan.": { en: "User not found.", zh: "未找到用户。" },
  "Gagal memuat kartu setelah pembaruan.": { en: "Could not load the card after updating it.", zh: "更新后无法加载卡牌。" },
  "Laporan koreksi tidak ditemukan.": { en: "Correction report not found.", zh: "未找到勘误报告。" },
  "Deck tidak ditemukan.": { en: "Deck not found.", zh: "未找到卡组。" },
  "Deck ini tidak dapat diperbarui oleh akun Anda.": { en: "Your account cannot update this deck.", zh: "您的账户无法更新此卡组。" },
  "Deck ini tidak dapat dihapus oleh akun Anda.": { en: "Your account cannot delete this deck.", zh: "您的账户无法删除此卡组。" },
  "Deck bawaan (preset) tidak dapat dihapus.": { en: "Preset decks cannot be deleted.", zh: "预设卡组不能删除。" },
  "Starter pack gratis sudah pernah diklaim sebelumnya.": { en: "The free starter pack has already been claimed.", zh: "免费新手礼包已领取。" },
  "Starter pack tidak ditemukan.": { en: "Starter pack not found.", zh: "未找到新手礼包。" },
  "Paket gratis harus diambil melalui klaim starter gratis.": { en: "Free packs must be obtained by claiming the free starter pack.", zh: "免费礼包必须通过领取免费新手礼包获得。" },
  "Order tidak ditemukan.": { en: "Order not found.", zh: "未找到订单。" },
  "Kanal pembayaran tidak tersedia untuk metode yang dipilih.": { en: "The selected payment method is unavailable.", zh: "所选支付方式不可用。" },
  "Callback tidak memiliki referensi order.": { en: "The payment callback is missing an order reference.", zh: "支付回调缺少订单编号。" },
  "Status callback pembayaran tidak dikenali.": { en: "The payment callback status is not recognized.", zh: "无法识别支付回调状态。" },
  "Callback pembayaran tidak memiliki nominal transaksi.": { en: "The payment callback is missing the transaction amount.", zh: "支付回调缺少交易金额。" },
  "Nominal callback tidak valid.": { en: "The callback amount is invalid.", zh: "回调金额无效。" },
  "Nominal callback tidak sesuai dengan order.": { en: "The callback amount does not match the order.", zh: "回调金额与订单不符。" },
  "Order callback tidak ditemukan.": { en: "The order referenced by the callback was not found.", zh: "未找到回调所引用的订单。" },
  "Deck wajib memiliki maksimal 10 kartu Karakter (minimal 1).": { en: "A deck must contain between 1 and 10 character cards.", zh: "卡组必须包含 1 至 10 张角色卡。" },
  "Deck maksimal memiliki 10 kartu Waditra (Instrumen).": { en: "A deck can contain up to 10 Waditra (instrument) cards.", zh: "卡组最多可包含 10 张 Waditra（乐器）卡。" },
  "Total kartu dalam satu deck maksimal 20 kartu.": { en: "A deck can contain up to 20 cards in total.", zh: "一个卡组最多可包含 20 张卡牌。" },
  "Deck tidak dapat memakai salinan kartu melebihi jumlah yang dimiliki akun.": { en: "A deck cannot include more copies of a card than your account owns.", zh: "卡组中的同名卡牌数量不能超过您账户拥有的数量。" },
  "Deck hanya dapat diperbarui oleh pemilik akun.": { en: "Only the account owner can update this deck.", zh: "只有账户所有者可以更新此卡组。" },
  "Kunci idempotensi escrow sudah digunakan.": { en: "This escrow idempotency key has already been used.", zh: "此托管幂等键已被使用。" },
  "Escrow harus berisi 1 sampai 20 jenis kartu.": { en: "Escrow must contain 1 to 20 card types.", zh: "托管必须包含 1 至 20 种卡牌。" },
  "Jumlah kartu escrow tidak valid.": { en: "The escrow card quantity is invalid.", zh: "托管卡牌数量无效。" },
  "Jumlah kartu escrow terlalu besar.": { en: "The escrow card quantity is too large.", zh: "托管卡牌数量过大。" },
  "Waktu kedaluwarsa escrow harus di masa depan.": { en: "The escrow expiration time must be in the future.", zh: "托管到期时间必须晚于当前时间。" },
  "Kunci idempotensi escrow tidak valid.": { en: "The escrow idempotency key is invalid.", zh: "托管幂等键无效。" },
  "Referensi escrow tidak valid.": { en: "The escrow reference is invalid.", zh: "托管编号无效。" },
  "Salah satu kartu escrow tidak tersedia.": { en: "One of the escrow cards is unavailable.", zh: "其中一张托管卡牌不可用。" },
  "Jumlah kartu tidak cukup untuk membuat escrow.": { en: "You do not have enough cards to create this escrow.", zh: "您的卡牌数量不足，无法创建此托管。" },
  "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi pada file .env server.": { en: "Google sign-in is not configured on the server.", zh: "服务器尚未配置 Google 登录。" },
  "Konfigurasi Google SSO (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) belum diisi di .env.": { en: "Google sign-in is not configured on the server.", zh: "服务器尚未配置 Google 登录。" },
  "Gagal menukar authorization code dengan Google OAuth 2.0 Token.": { en: "Could not complete sign-in with Google.", zh: "无法完成 Google 登录。" },
  "Respons token Google tidak menyertakan access_token.": { en: "Google did not return an access token.", zh: "Google 未返回访问令牌。" },
  "Gagal mengambil profil pengguna dari Google.": { en: "Could not retrieve your Google profile.", zh: "无法获取您的 Google 个人资料。" },
  "Akun Google ini sudah terdaftar pada pengguna lain. Silakan keluar dan masuk langsung menggunakan akun Google tersebut.": { en: "This Google account is linked to another user. Sign out and sign in directly with that Google account.", zh: "此 Google 账户已关联其他用户。请退出后直接使用该 Google 账户登录。" },
  "Alamat email Google ini sudah terdaftar pada akun lain. Silakan keluar dan masuk langsung menggunakan akun tersebut.": { en: "This Google email is already linked to another account. Sign out and sign in directly with that account.", zh: "此 Google 邮箱已关联其他账户。请退出后直接使用该账户登录。" },
  "Set a unique ADMIN_USERNAME and ADMIN_PASSWORD_HASH in the server environment before enabling admin login.": { id: "Login admin belum dikonfigurasi pada server.", en: "Admin sign-in is not configured on the server.", zh: "服务器尚未配置管理员登录。" },
  "Mode PROD membutuhkan penyimpanan Prisma yang persisten.": { en: "Production mode requires persistent Prisma storage.", zh: "生产模式需要使用持久化 Prisma 存储。" },
  "Mode PROD mensyaratkan penyimpanan Prisma aktif.": { en: "Production mode requires Prisma storage to be enabled.", zh: "生产模式要求启用 Prisma 存储。" },
  "Konfigurasi payment bridge Menu Kita belum lengkap.": { en: "Menu Kita payment configuration is incomplete.", zh: "Menu Kita 支付配置不完整。" },
  "Menu Kita payment gateway tidak dapat dihubungi.": { en: "Could not connect to the Menu Kita payment service.", zh: "无法连接到 Menu Kita 支付服务。" },
  "Menu Kita gagal membuat pembayaran. Coba lagi beberapa saat.": { en: "Menu Kita could not create the payment. Please try again shortly.", zh: "Menu Kita 无法创建支付。请稍后重试。" },
  "Card escrow membutuhkan storage PostgreSQL.": { en: "Card escrow requires PostgreSQL storage.", zh: "卡牌托管需要使用 PostgreSQL 存储。" },
  "Escrow kartu tidak ditemukan.": { en: "Card escrow not found.", zh: "未找到卡牌托管。" },
  "Battle authoritative memerlukan storage Prisma di production.": { en: "Authoritative battles require Prisma storage in production.", zh: "生产环境中的权威对战需要使用 Prisma 存储。" },
  "Quick match memerlukan storage Prisma di production.": { en: "Quick match requires Prisma storage in production.", zh: "生产环境中的快速匹配需要使用 Prisma 存储。" },
  "Kartu tidak ditemukan.": { en: "Card not found.", zh: "未找到卡牌。" },
  "Terjadi kesalahan internal server.": { en: "A server error occurred. Please try again.", zh: "服务器发生错误，请重试。" },
  "Input validation failed": { id: "Data yang dikirim tidak valid.", en: "Some of the submitted information is invalid.", zh: "提交的信息中有些内容无效。" },
  "Nama deck minimal 2 karakter.": { en: "The deck name must be at least 2 characters long.", zh: "卡组名称至少需要 2 个字符。" },
  "Deck wajib memiliki minimal 1 kartu Karakter.": { en: "A deck must contain at least 1 character card.", zh: "卡组至少需要包含 1 张角色卡。" },
  "Deck maksimal memiliki 10 kartu Karakter.": { en: "A deck can contain up to 10 character cards.", zh: "卡组最多可包含 10 张角色卡。" },
  "Nama pelapor minimal 2 karakter.": { en: "The reporter name must be at least 2 characters long.", zh: "报告者姓名至少需要 2 个字符。" },
  "Deskripsi koreksi minimal 10 karakter.": { en: "The correction description must be at least 10 characters long.", zh: "勘误描述至少需要 10 个字符。" },
  "Hasil pertandingan hanya dicatat oleh server saat match authoritative selesai.": { en: "Match results are recorded by the server when an authoritative match ends.", zh: "权威对局结束时，服务器会记录对局结果。" },
};

const CODE_MESSAGES: Record<string, { key: string; id: string; en: string; zh: string }> = {
  BAD_REQUEST: { key: "api.error.badRequest", id: "Permintaan tidak dapat diproses.", en: "The request could not be processed.", zh: "无法处理此请求。" },
  VALIDATION_ERROR: { key: "api.error.validation", id: "Data yang dikirim tidak valid.", en: "The submitted information is invalid.", zh: "提交的信息无效。" },
  UNAUTHORIZED: { key: "api.error.unauthorized", id: "Silakan masuk untuk melanjutkan.", en: "Please sign in to continue.", zh: "请登录以继续。" },
  FORBIDDEN: { key: "api.error.forbidden", id: "Anda tidak memiliki akses untuk melakukan tindakan ini.", en: "You do not have permission to do this.", zh: "您无权执行此操作。" },
  NOT_FOUND: { key: "api.error.notFound", id: "Data yang diminta tidak ditemukan.", en: "The requested item was not found.", zh: "未找到请求的内容。" },
  CONFLICT: { key: "api.error.conflict", id: "Data telah berubah. Muat ulang lalu coba lagi.", en: "The data has changed. Reload and try again.", zh: "数据已更改，请刷新后重试。" },
  TOO_MANY_REQUESTS: { key: "api.error.rateLimit", id: "Terlalu banyak permintaan. Coba lagi sebentar.", en: "Too many requests. Please try again shortly.", zh: "请求过于频繁，请稍后重试。" },
  INTERNAL_ERROR: { key: "api.error.internal", id: "Terjadi kesalahan internal server.", en: "A server error occurred. Please try again.", zh: "服务器发生错误，请重试。" },
};

const DYNAMIC_TRANSLATIONS: Array<{
  pattern: RegExp;
  key: string;
  render: (match: RegExpMatchArray, locale: SupportedLocale) => LocalizedServerMessage;
}> = [
  {
    pattern: /^Kartu karakter '(.+)' tidak aktif atau tidak ditemukan\.$/,
    key: "server.card.characterUnavailable",
    render: (match, locale) => ({
      messageKey: "server.card.characterUnavailable",
      messageParams: { slug: match[1] },
      message: locale === "id"
        ? `Kartu karakter '${match[1]}' tidak aktif atau tidak ditemukan.`
        : locale === "en"
          ? `Character card '${match[1]}' is inactive or was not found.`
          : `角色卡“${match[1]}”未启用或不存在。`,
    }),
  },
  {
    pattern: /^Kartu instrumen '(.+)' tidak aktif atau tidak ditemukan\.$/,
    key: "server.card.instrumentUnavailable",
    render: (match, locale) => ({
      messageKey: "server.card.instrumentUnavailable",
      messageParams: { slug: match[1] },
      message: locale === "id"
        ? `Kartu instrumen '${match[1]}' tidak aktif atau tidak ditemukan.`
        : locale === "en"
          ? `Instrument card '${match[1]}' is inactive or was not found.`
          : `乐器卡“${match[1]}”未启用或不存在。`,
    }),
  },
  {
    pattern: /^Kartu dengan slug '(.+)' tidak ditemukan\.$/,
    key: "server.card.slugNotFound",
    render: (match, locale) => ({
      messageKey: "server.card.slugNotFound",
      messageParams: { slug: match[1] },
      message: locale === "id"
        ? `Kartu dengan slug '${match[1]}' tidak ditemukan.`
        : locale === "en"
          ? `No card was found with slug '${match[1]}'.`
          : `未找到 slug 为“${match[1]}”的卡牌。`,
    }),
  },
  {
    pattern: /^Kartu '(.+)' tidak ditemukan\.$/,
    key: "server.card.notFound",
    render: (match, locale) => ({
      messageKey: "server.card.notFound",
      messageParams: { slug: match[1] },
      message: locale === "id"
        ? `Kartu '${match[1]}' tidak ditemukan.`
        : locale === "en"
          ? `Card '${match[1]}' was not found.`
          : `未找到卡牌“${match[1]}”。`,
    }),
  },
  {
    pattern: /^Paket '(.+)' tidak ditemukan\.$/,
    key: "server.shop.packNotFound",
    render: (match, locale) => ({
      messageKey: "server.shop.packNotFound",
      messageParams: { pack: match[1] },
      message: locale === "id"
        ? `Paket '${match[1]}' tidak ditemukan.`
        : locale === "en"
          ? `Pack '${match[1]}' was not found.`
          : `未找到礼包“${match[1]}”。`,
    }),
  },
];

function keyFromMessage(source: string): string {
  const slug = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `server.message.${slug || "unknown"}`;
}

export function resolveServerLocale(
  explicitLocale: string | null | undefined,
  acceptLanguage: string | null | undefined,
): SupportedLocale {
  const normalizedExplicitLocale = explicitLocale?.toLowerCase();
  if (normalizedExplicitLocale && isSupportedLocale(normalizedExplicitLocale)) {
    return normalizedExplicitLocale;
  }
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const candidates: Array<{ index: number; locale: SupportedLocale; quality: number }> = [];
  for (const [index, preference] of acceptLanguage.split(",").entries()) {
    const [range = "", ...parameters] = preference.trim().split(";");
    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
    const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
    const quality = Number.isFinite(parsedQuality) && parsedQuality <= 1 ? parsedQuality : 0;
    const language = range.trim().split("-")[0]?.toLowerCase();
    if (quality > 0 && language && isSupportedLocale(language)) {
      candidates.push({ index, locale: language, quality });
    }
  }
  candidates.sort((first, second) => second.quality - first.quality || first.index - second.index);

  return candidates[0]?.locale ?? DEFAULT_LOCALE;
}

export function localizeServerMessage(
  source: string,
  locale: SupportedLocale,
  fallbackCode = "INTERNAL_ERROR"
): LocalizedServerMessage {
  for (const dynamic of DYNAMIC_TRANSLATIONS) {
    const match = source.match(dynamic.pattern);
    if (match) return dynamic.render(match, locale);
  }

  const translated = TRANSLATIONS[source];
  if (translated) {
    return {
      messageKey: keyFromMessage(source),
      message: locale === "id" ? translated.id ?? source : translated[locale],
    };
  }

  const fallback = CODE_MESSAGES[fallbackCode] ?? CODE_MESSAGES.INTERNAL_ERROR;
  return {
    messageKey: fallback.key,
    message: fallback[locale],
  };
}

export function localizeMessageKey(
  messageKey: string | undefined,
  messageParams: ServerMessageValues | undefined,
  locale: SupportedLocale,
  legacyMessage: string,
): string {
  if (!messageKey) return legacyMessage;
  if (messageKey.startsWith("api.error.")) {
    const code = Object.entries(CODE_MESSAGES).find(([, value]) => value.key === messageKey)?.[0];
    const generic = code ? CODE_MESSAGES[code] : undefined;
    if (generic) return generic[locale];
  }

  const dynamic = DYNAMIC_TRANSLATIONS.find((entry) => entry.key === messageKey);
  if (dynamic && messageParams) {
    const templates: Record<string, string> = {
      "server.card.characterUnavailable": locale === "id"
        ? "Kartu karakter '{slug}' tidak aktif atau tidak ditemukan."
        : locale === "en"
          ? "Character card '{slug}' is inactive or was not found."
          : "角色卡“{slug}”未启用或不存在。",
      "server.card.instrumentUnavailable": locale === "id"
        ? "Kartu instrumen '{slug}' tidak aktif atau tidak ditemukan."
        : locale === "en"
          ? "Instrument card '{slug}' is inactive or was not found."
          : "乐器卡“{slug}”未启用或不存在。",
      "server.card.slugNotFound": locale === "id"
        ? "Kartu dengan slug '{slug}' tidak ditemukan."
        : locale === "en"
          ? "No card was found with slug '{slug}'."
          : "未找到 slug 为“{slug}”的卡牌。",
      "server.card.notFound": locale === "id"
        ? "Kartu '{slug}' tidak ditemukan."
        : locale === "en"
          ? "Card '{slug}' was not found."
          : "未找到卡牌“{slug}”。",
      "server.shop.packNotFound": locale === "id"
        ? "Paket '{pack}' tidak ditemukan."
        : locale === "en"
          ? "Pack '{pack}' was not found."
          : "未找到礼包“{pack}”。",
    };
    const rendered = templates[messageKey];
    if (rendered) {
      return rendered.replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, name: string) =>
        Object.prototype.hasOwnProperty.call(messageParams, name)
          ? String(messageParams[name])
          : placeholder
      );
    }
  }

  const source = Object.keys(TRANSLATIONS).find((entry) => keyFromMessage(entry) === messageKey);
  const template = source
    ? locale === "id" ? TRANSLATIONS[source].id ?? source : TRANSLATIONS[source][locale]
    : undefined;
  if (!template) return legacyMessage;
  if (!messageParams) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(messageParams, name)
      ? String(messageParams[name])
      : placeholder
  );
}
