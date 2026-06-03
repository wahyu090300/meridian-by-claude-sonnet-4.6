#!/data/data/com.termux/files/usr/bin/bash

# ============================================================
#  MERIDIAN — Termux Auto Setup Script
#  Repo: https://github.com/yunus-0x/meridian
# ============================================================

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
DIM="\033[2m"

print_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "  ███╗   ███╗███████╗██████╗ ██╗██████╗ ██╗ █████╗ ███╗  ██╗"
  echo "  ████╗ ████║██╔════╝██╔══██╗██║██╔══██╗██║██╔══██║████╗ ██║"
  echo "  ██╔████╔██║█████╗  ██████╔╝██║██║  ██║██║███████║██╔██╗██║"
  echo "  ██║╚██╔╝██║██╔══╝  ██╔══██╗██║██║  ██║██║██╔══██║██║╚████║"
  echo "  ██║ ╚═╝ ██║███████╗██║  ██║██║██████╔╝██║██║  ██║██║ ╚███║"
  echo "  ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
  echo -e "${RESET}"
  echo -e "${DIM}  Autonomous DLMM LP Agent for Meteora on Solana${RESET}"
  echo -e "${DIM}  ─────────────────────────────────────────────${RESET}"
  echo ""
}

step() {
  echo -e "${CYAN}${BOLD}[►] $1${RESET}"
}

ok() {
  echo -e "${GREEN}${BOLD}[✓] $1${RESET}"
}

warn() {
  echo -e "${YELLOW}[!] $1${RESET}"
}

fail() {
  echo -e "${RED}${BOLD}[✗] $1${RESET}"
  exit 1
}

prompt_input() {
  local label="$1"
  local varname="$2"
  local secret="$3"
  echo -ne "${YELLOW}${BOLD}  → ${label}: ${RESET}"
  if [ "$secret" = "true" ]; then
    read -s val
    echo ""
  else
    read val
  fi
  eval "$varname=\"$val\""
}

# ── Banner ──────────────────────────────────────────────────
clear
print_banner

echo -e "${BOLD}  Setup akan melakukan hal berikut:${RESET}"
echo -e "  ${DIM}1. Update & install paket Termux yang dibutuhkan${RESET}"
echo -e "  ${DIM}2. Install Node.js 18+${RESET}"
echo -e "  ${DIM}3. Clone repo Meridian${RESET}"
echo -e "  ${DIM}4. Install npm dependencies${RESET}"
echo -e "  ${DIM}5. Buat file .env dari input kamu${RESET}"
echo -e "  ${DIM}6. Copy user-config.example.json → user-config.json${RESET}"
echo ""
echo -ne "${YELLOW}${BOLD}  Lanjutkan? (y/n): ${RESET}"
read confirm
[ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && echo "Dibatalkan." && exit 0
echo ""

# ── 1. Update Termux packages ────────────────────────────────
step "Update paket Termux..."
pkg update -y -o Dpkg::Options::="--force-confnew" 2>/dev/null || fail "Gagal update pkg"
ok "Paket ter-update"

# ── 2. Install dependencies ──────────────────────────────────
step "Install git, nodejs, npm..."
pkg install -y git nodejs 2>/dev/null || fail "Gagal install nodejs/git"
ok "Node.js $(node -v) & git terinstall"

# ── 3. Clone repo ────────────────────────────────────────────
INSTALL_DIR="$HOME/meridian"
if [ -d "$INSTALL_DIR" ]; then
  warn "Folder ~/meridian sudah ada."
  echo -ne "${YELLOW}  Hapus & clone ulang? (y/n): ${RESET}"
  read reclone
  if [ "$reclone" = "y" ] || [ "$reclone" = "Y" ]; then
    rm -rf "$INSTALL_DIR"
  else
    warn "Menggunakan folder yang sudah ada."
  fi
fi

if [ ! -d "$INSTALL_DIR" ]; then
  step "Clone repo Meridian..."
  git clone https://github.com/yunus-0x/meridian "$INSTALL_DIR" || fail "Gagal clone repo"
  ok "Repo berhasil di-clone ke ~/meridian"
fi

cd "$INSTALL_DIR" || fail "Tidak bisa masuk ke folder meridian"

# ── 4. Install npm dependencies ──────────────────────────────
step "Install npm dependencies (mungkin agak lama)..."
npm install 2>/dev/null || fail "Gagal npm install"
ok "Dependencies terinstall"

# ── 5. Input konfigurasi ─────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Konfigurasi .env${RESET}"
echo -e "${DIM}  (tekan Enter untuk skip field opsional)${RESET}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

prompt_input "WALLET_PRIVATE_KEY (base58) *wajib*" WALLET_KEY "true"
prompt_input "RPC_URL (default: helius pump)" RPC_URL "false"
prompt_input "OPENROUTER_API_KEY *wajib*" OPENROUTER_KEY "true"
prompt_input "HELIUS_API_KEY (opsional)" HELIUS_KEY "false"
prompt_input "TELEGRAM_BOT_TOKEN (opsional)" TG_TOKEN "false"
prompt_input "DRY_RUN? (true/false, default: true)" DRY_RUN "false"

[ -z "$DRY_RUN" ] && DRY_RUN="true"
[ -z "$RPC_URL" ] && RPC_URL="https://pump.helius-rpc.com"

step "Membuat file .env..."
cat > "$INSTALL_DIR/.env" <<EOF
WALLET_PRIVATE_KEY=$WALLET_KEY
RPC_URL=$RPC_URL
OPENROUTER_API_KEY=$OPENROUTER_KEY
HELIUS_API_KEY=$HELIUS_KEY
TELEGRAM_BOT_TOKEN=$TG_TOKEN
DRY_RUN=$DRY_RUN
EOF
ok ".env berhasil dibuat"

# ── 6. Copy user-config ───────────────────────────────────────
if [ ! -f "$INSTALL_DIR/user-config.json" ]; then
  step "Copy user-config.example.json → user-config.json..."
  cp "$INSTALL_DIR/user-config.example.json" "$INSTALL_DIR/user-config.json" 2>/dev/null \
    || warn "user-config.example.json tidak ditemukan, skip."
  ok "user-config.json siap"
else
  warn "user-config.json sudah ada, tidak ditimpa."
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  ✓ Setup selesai!${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}  Cara menjalankan Meridian:${RESET}"
echo -e "  ${CYAN}cd ~/meridian${RESET}"
echo -e "  ${CYAN}npm run dev${RESET}    ${DIM}← dry run (aman, tanpa transaksi nyata)${RESET}"
echo -e "  ${CYAN}npm start${RESET}      ${DIM}← live mode (transaksi nyata!)${RESET}"
echo ""
echo -e "${DIM}  ⚠  Selalu test dengan DRY_RUN=true dulu sebelum live.${RESET}"
echo ""
