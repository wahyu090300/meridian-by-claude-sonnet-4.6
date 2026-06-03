#!/usr/bin/env node

// ============================================================
//  MERIDIAN — Devnet Wallet Setup
//  Generate wallet baru + airdrop SOL devnet + update .env
//  Script by Claude Sonnet 4.6
// ============================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const RED    = "\x1b[31m";
const DIM    = "\x1b[2m";

const step  = (msg) => console.log(`\n${CYAN}${BOLD}[►] ${msg}${RESET}`);
const ok    = (msg) => console.log(`${GREEN}${BOLD}    ✓ ${msg}${RESET}`);
const warn  = (msg) => console.log(`${YELLOW}    ! ${msg}${RESET}`);
const info  = (msg) => console.log(`${DIM}    → ${msg}${RESET}`);
const fail  = (msg) => { console.log(`\n${RED}${BOLD}[✗] ERROR: ${msg}${RESET}\n`); process.exit(1); };

const ENV_PATH    = path.join(process.env.HOME, "meridian", ".env");
const WALLET_PATH = path.join(process.env.HOME, "devnet-wallet.json");

// ── Helper: fetch via https ──────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// ── Helper: RPC call ke devnet ───────────────────────────────
function rpcCall(method, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: "2.0", id: 1, method, params
    });
    const options = {
      hostname: "api.devnet.solana.com",
      path: "/",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Helper: update .env ──────────────────────────────────────
function updateEnv(key, value) {
  if (!fs.existsSync(ENV_PATH)) fail(`.env tidak ditemukan di ${ENV_PATH}`);
  let content = fs.readFileSync(ENV_PATH, "utf8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(ENV_PATH, content);
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(`${CYAN}${BOLD}`);
  console.log("  ╔═══════════════════════════════════════╗");
  console.log("  ║   MERIDIAN — Devnet Wallet Setup      ║");
  console.log("  ║   Script by Claude Sonnet 4.6         ║");
  console.log("  ╚═══════════════════════════════════════╝");
  console.log(`${RESET}`);
  console.log(`${DIM}  Generate wallet devnet + airdrop SOL gratis${RESET}\n`);

  // ── Step 1: Install @solana/web3.js jika belum ada ──────────
  step("Cek & install @solana/web3.js...");
  try {
    require.resolve("@solana/web3.js");
    ok("@solana/web3.js sudah terinstall");
  } catch {
    info("Install @solana/web3.js (sebentar)...");
    try {
      execSync("npm install @solana/web3.js", {
        cwd: path.join(process.env.HOME, "meridian"),
        stdio: "pipe"
      });
      ok("@solana/web3.js berhasil diinstall");
    } catch (e) {
      fail("Gagal install @solana/web3.js: " + e.message);
    }
  }

  const solana = require(path.join(
    process.env.HOME, "meridian", "node_modules", "@solana", "web3.js"
  ));

  // ── Step 2: Generate wallet baru ─────────────────────────────
  step("Generate wallet devnet baru...");
  const keypair = solana.Keypair.generate();
  const publicKey  = keypair.publicKey.toBase58();
  const privateKey = Buffer.from(keypair.secretKey).toString("base64");

  // Simpan keypair ke file JSON (format array)
  fs.writeFileSync(WALLET_PATH, JSON.stringify(Array.from(keypair.secretKey)));

  ok(`Public key : ${publicKey}`);
  ok(`Wallet disimpan di ~/devnet-wallet.json`);

  // ── Step 3: Airdrop SOL devnet ───────────────────────────────
  step("Request airdrop 2 SOL di devnet...");
  info("Menghubungi api.devnet.solana.com...");

  let airdropSig;
  try {
    const connection = new solana.Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const airdropAmount = 2 * solana.LAMPORTS_PER_SOL;
    airdropSig = await connection.requestAirdrop(
      keypair.publicKey,
      airdropAmount
    );
    info(`Signature: ${airdropSig}`);
    info("Menunggu konfirmasi...");

    await connection.confirmTransaction(airdropSig, "confirmed");
    ok("Airdrop 2 SOL berhasil!");

    // Cek balance
    const balance = await connection.getBalance(keypair.publicKey);
    ok(`Balance sekarang: ${balance / solana.LAMPORTS_PER_SOL} SOL (devnet)`);

  } catch (e) {
    warn("Airdrop gagal: " + e.message);
    warn("Devnet kadang tidak stabil. Coba manual di: https://faucet.solana.com");
    warn("Lanjut update .env dulu, airdrop bisa dilakukan manual nanti.");
  }

  // ── Step 4: Update .env ──────────────────────────────────────
  step("Update file .env Meridian...");

  // Backup .env dulu
  const backupPath = ENV_PATH + ".backup";
  fs.copyFileSync(ENV_PATH, backupPath);
  info(`Backup .env disimpan di .env.backup`);

  // Convert secretKey ke base58 untuk Meridian
  const bs58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function toBase58(buffer) {
    let digits = [0];
    for (let i = 0; i < buffer.length; i++) {
      let carry = buffer[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let result = "";
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) result += "1";
    for (let i = digits.length - 1; i >= 0; i--) result += bs58Chars[digits[i]];
    return result;
  }

  const privateKeyBase58 = toBase58(keypair.secretKey);

  updateEnv("WALLET_PRIVATE_KEY", privateKeyBase58);
  updateEnv("RPC_URL", "https://api.devnet.solana.com");
  updateEnv("DRY_RUN", "false");

  ok(".env berhasil diupdate");

  // ── Selesai ──────────────────────────────────────────────────
  console.log(`\n${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${GREEN}${BOLD}  ✓  Devnet Wallet Siap!${RESET}`);
  console.log(`${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);
  console.log(`${BOLD}  Public Key  :${RESET} ${CYAN}${publicKey}${RESET}`);
  console.log(`${BOLD}  Network     :${RESET} ${YELLOW}Devnet (SOL tidak nyata)${RESET}`);
  console.log(`${BOLD}  DRY_RUN     :${RESET} ${RED}false (simulasi live)${RESET}`);
  console.log(`\n${DIM}  Backup .env lama ada di ~/meridian/.env.backup${RESET}`);
  console.log(`\n${BOLD}  Jalankan Meridian:${RESET}`);
  console.log(`  ${CYAN}cd ~/meridian && npm start${RESET}`);
  console.log(`\n${DIM}  ⚠  Kalau mau balik ke wallet asli:${RESET}`);
  console.log(`  ${DIM}cp ~/meridian/.env.backup ~/meridian/.env${RESET}\n`);
}

main().catch(e => fail(e.message));
