#!/data/data/com.termux/files/usr/bin/bash

# ============================================================
#  MERIDIAN — Termux Auto Setup Script
#  Repo: https://github.com/yunus-0x/meridian
#  Script by: Claude Sonnet 4.6
# ============================================================

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
DIM="\033[2m"

print_banner() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "  ███╗   ███╗███████╗██████╗ ██╗██████╗ ██╗ █████╗ ███╗  ██╗"
  echo "  ████╗ ████║██╔════╝██╔══██╗██║██╔══██╗██║██╔══██╗████╗ ██║"
  echo "  ██╔████╔██║█████╗  ██████╔╝██║██║  ██║██║███████║██╔██╗██║"
  echo "  ██║╚██╔╝██║██╔══╝  ██╔══██╗██║██║  ██║██║██╔══██║██║╚████║"
  echo "  ██║ ╚═╝ ██║███████╗██║  ██║██║██████╔╝██║██║  ██║██║ ╚███║"
  echo "  ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
  echo -e "${RESET}"
  echo -e "  ${DIM}Autonomous DLMM LP Agent for Meteora on Solana${RESET}"
  echo -e "  ${DIM}Script by Claude Sonnet 4.6${RESET}"
  echo ""
}

step()  { echo -e "\n${CYAN}${BOLD}[►] $1${RESET}"; }
ok()    { echo -e "${GREEN}${BOLD}    ✓ $1${RESET}"; }
warn()  { echo -e "${YELLOW}    ! $1${RESET}"; }
info()  { echo -e "${DIM}    → $1${RESET}"; }
fail()  { echo -e "\n${RED}${BOLD}[✗] ERROR: $1${RESET}\n"; exit 1; }
divider(){ echo -e "${DIM}  ────────────────────────────────────────${RESET}"; }

prompt_required() {
  local label="$1" varname="$2" secret="$3"
  local val=""
  while [ -z "$val" ]; do
    echo -ne "${YELLOW}${BOLD}  → ${label}: ${RESET}"
    if [ "$secret" = "true" ]; then read -s val; echo ""; else read val; fi
    [ -z "$val" ] && echo -e "${RED}    ✗ Tidak boleh kosong, coba lagi.${RESET}"
  done
  eval "$varname=\"$val\""
}

prompt_optional() {
  local label="$1" varname="$2" default="$3"
  echo -ne "${DIM}  → ${label}${RESET}${YELLOW} (default: ${default}): ${RESET}"
  read val
  [ -z "$val" ] && val="$default"
  eval "$varname=\"$val\""
}

# ── Validasi: harus di Termux ────────────────────────────────
if [ ! -f "/data/data/com.termux/files/usr/bin/bash" ] && ! command -v pkg &>/dev/null; then
  fail "Script ini hanya untuk Termux di Android."
fi

INSTALL_DIR="$HOME/meridian"

# ── Banner & ringkasan ───────────────────────────────────────
print_banner
echo -e "${BOLD}  Yang akan dilakukan:${RESET}"
echo -e "  ${DIM}1. Setup storage akses Termux${RESET}"
echo -e "  ${DIM}2. Update & install git, nodejs${RESET}"
echo -e "  ${DIM}3. Clone repo yunus-0x/meridian${RESET}"
echo -e "  ${DIM}4. npm install dependencies${RESET}"
echo -e "  ${DIM}5. Buat .env dari inputmu${RESET}"
echo -e "  ${DIM}6. Siapkan user-config.json${RESET}"
echo -e "  ${DIM}7. (Opsional) Install pm2 untuk background process${RESET}"
echo ""
echo -ne "${YELLOW}${BOLD}  Lanjutkan setup? (y/n): ${RESET}"
read confirm
[[ "$confirm" != "y" && "$confirm" != "Y" ]] && echo "Dibatalkan." && exit 0

# ── 1. Storage access ────────────────────────────────────────
step "Setup storage Termux..."
if [ ! -d "$HOME/storage" ]; then
  info "Meminta izin akses storage..."
  termux-setup-storage
  sleep 2
  ok "Storage disetup"
else
  ok "Storage sudah tersedia"
fi

# ── 2. Update & install ──────────────────────────────────────
step "Update paket & install dependencies..."
info "Update pkg (bisa makan waktu sebentar)..."
pkg update -y -o Dpkg::Options::="--force-confnew" 2>/dev/null || fail "Gagal update pkg. Cek koneksi internet."
pkg install -y git nodejs 2>/dev/null || fail "Gagal install git/nodejs."
ok "Node.js $(node -v) terinstall"
ok "git $(git --version | awk '{print $3}') terinstall"

# ── 3. Clone repo ────────────────────────────────────────────
step "Clone repo Meridian..."
if [ -d "$INSTALL_DIR" ]; then
  warn "Folder ~/meridian sudah ada."
  echo -ne "${YELLOW}  → Hapus & clone ulang? (y/n): ${RESET}"
  read reclone
  if [[ "$reclone" == "y" || "$reclone" == "Y" ]]; then
    rm -rf "$INSTALL_DIR"
    info "Folder lama dihapus."
  else
    info "Menggunakan folder yang sudah ada."
  fi
fi

if [ ! -d "$INSTALL_DIR" ]; then
  git clone https://github.com/yunus-0x/meridian "$INSTALL_DIR" \
    || fail "Gagal clone repo. Cek koneksi internet."
  ok "Repo berhasil di-clone ke ~/meridian"
fi

cd "$INSTALL_DIR" || fail "Tidak bisa masuk ke folder ~/meridian"

# ── 4. npm install ───────────────────────────────────────────
step "Install npm dependencies..."
info "Proses ini bisa makan waktu 2-5 menit..."
npm install 2>/dev/null || fail "Gagal npm install."
ok "Dependencies berhasil diinstall"

# ── 5. Konfigurasi .env ──────────────────────────────────────
divider
echo ""
echo -e "${BOLD}  Konfigurasi .env${RESET}"
echo -e "  ${DIM}Field bertanda * wajib diisi. Tekan Enter untuk skip opsional.${RESET}"
echo ""

prompt_required "OPENROUTER_API_KEY *" OPENROUTER_KEY "true"
prompt_required "WALLET_PRIVATE_KEY (base58) *" WALLET_KEY "true"
prompt_optional "RPC_URL" RPC_URL "https://pump.helius-rpc.com"
prompt_optional "HELIUS_API_KEY (opsional, untuk data balance)" HELIUS_KEY ""
prompt_optional "TELEGRAM_BOT_TOKEN (opsional)" TG_TOKEN ""
prompt_optional "DRY_RUN" DRY_RUN "true"

step "Menyimpan file .env..."
cat > "$INSTALL_DIR/.env" <<EOF
OPENROUTER_API_KEY=$OPENROUTER_KEY
WALLET_PRIVATE_KEY=$WALLET_KEY
RPC_URL=$RPC_URL
HELIUS_API_KEY=$HELIUS_KEY
TELEGRAM_BOT_TOKEN=$TG_TOKEN
DRY_RUN=$DRY_RUN
EOF
ok ".env berhasil disimpan"

# ── 6. user-config.json ──────────────────────────────────────
step "Siapkan user-config.json..."
if [ ! -f "$INSTALL_DIR/user-config.json" ]; then
  if [ -f "$INSTALL_DIR/user-config.example.json" ]; then
    cp "$INSTALL_DIR/user-config.example.json" "$INSTALL_DIR/user-config.json"
    ok "user-config.json dibuat dari contoh"
  else
    warn "user-config.example.json tidak ditemukan, membuat config minimal..."
    cat > "$INSTALL_DIR/user-config.json" <<'CONF'
{
  "deployAmountSol": 0.5,
  "maxPositions": 3,
  "minSolToOpen": 0.07,
  "managementIntervalMin": 10,
  "screeningIntervalMin": 30,
  "minFeeActiveTvlRatio": 0.05,
  "minTvl": 10000,
  "maxTvl": 150000,
  "minOrganic": 65,
  "minHolders": 500,
  "outOfRangeWaitMinutes": 30,
  "takeProfitFeePct": 5,
  "dryRun": true
}
CONF
    ok "user-config.json minimal dibuat"
  fi
else
  warn "user-config.json sudah ada, tidak ditimpa."
fi

# ── 7. pm2 (opsional) ────────────────────────────────────────
step "Install pm2 untuk background process? (opsional tapi disarankan)"
echo -ne "${YELLOW}  → Install pm2? (y/n): ${RESET}"
read install_pm2
if [[ "$install_pm2" == "y" || "$install_pm2" == "Y" ]]; then
  npm install -g pm2 2>/dev/null && ok "pm2 terinstall" || warn "Gagal install pm2, skip."
fi

# ── Selesai ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  ✓  Setup Meridian Selesai!${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}  Cara menjalankan:${RESET}"
echo ""
echo -e "  ${CYAN}cd ~/meridian${RESET}"
echo ""
echo -e "  ${BOLD}Mode dry run (aman, disarankan dulu):${RESET}"
echo -e "  ${CYAN}npm run dev${RESET}"
echo ""
echo -e "  ${BOLD}Mode live (transaksi nyata!):${RESET}"
echo -e "  ${CYAN}npm start${RESET}"
echo ""

if command -v pm2 &>/dev/null; then
  echo -e "  ${BOLD}Jalankan di background dengan pm2:${RESET}"
  echo -e "  ${CYAN}pm2 start npm --name meridian -- run dev${RESET}  ${DIM}← dry run${RESET}"
  echo -e "  ${CYAN}pm2 start npm --name meridian -- start${RESET}    ${DIM}← live${RESET}"
  echo -e "  ${CYAN}pm2 logs meridian${RESET}   ${DIM}← lihat log${RESET}"
  echo -e "  ${CYAN}pm2 stop meridian${RESET}   ${DIM}← stop${RESET}"
  echo ""
fi

echo -e "${DIM}  ⚠  Selalu test DRY_RUN=true dulu sebelum live trading.${RESET}"
echo -e "${DIM}  ⚠  Jangan pernah share private key atau file .env kamu.${RESET}"
echo ""
