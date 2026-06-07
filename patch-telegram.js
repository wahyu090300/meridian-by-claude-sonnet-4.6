#!/usr/bin/env node
// ============================================================
//  MERIDIAN — Telegram Notif Beauty Patch
//  Memperindah format notifikasi Telegram
//  Script by Claude Sonnet 4.6
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TELEGRAM_PATH = path.join(__dirname, "telegram.js");

console.log("\x1b[36m\x1b[1m");
console.log("  ╔══════════════════════════════════════════╗");
console.log("  ║   MERIDIAN — Telegram Beauty Patch       ║");
console.log("  ║   Script by Claude Sonnet 4.6            ║");
console.log("  ╚══════════════════════════════════════════╝");
console.log("\x1b[0m");

// ── Backup dulu ──────────────────────────────────────────────
const backupPath = TELEGRAM_PATH + ".backup";
fs.copyFileSync(TELEGRAM_PATH, backupPath);
console.log(`\x1b[2m  → Backup disimpan di telegram.js.backup\x1b[0m`);

let content = fs.readFileSync(TELEGRAM_PATH, "utf8");

// ── Helper functions yang akan ditambahkan ───────────────────
const HELPERS = `
// ─── Beauty Helpers ──────────────────────────────────────────
function progressBar(pct, len = 16) {
  const filled = Math.round((pct / 100) * len);
  const half = filled === len - 1 && pct % (100 / len) > 0.5;
  let bar = "█".repeat(Math.max(0, filled));
  if (half) bar += "▓";
  bar += "░".repeat(Math.max(0, len - filled - (half ? 1 : 0)));
  return bar;
}

function pnlEmoji(pct) {
  if (pct >= 10) return "🚀";
  if (pct >= 5)  return "🟢";
  if (pct >= 0)  return "🟡";
  if (pct >= -5) return "🟠";
  return "🔴";
}

function yieldEmoji(apy) {
  if (apy >= 500) return "🔥🔥";
  if (apy >= 200) return "🔥";
  if (apy >= 100) return "⚡";
  if (apy >= 50)  return "✨";
  return "💧";
}

function fmtSol(val) {
  return val != null ? \`◎\${Number(val).toFixed(4)}\` : "◎?";
}

function fmtUsd(val) {
  return val != null ? \`$\${Number(val).toFixed(2)}\` : "$?";
}
`;

// ── Patch notifyDeploy ───────────────────────────────────────
const OLD_DEPLOY = `export async function notifyDeploy({ pair, amountSol, position, tx, priceRange, rangeCoverage, binStep, baseFee }) {
  if (hasActiveLiveMessage()) return;
  const priceStr = priceRange
    ? \`Price range: \${priceRange.min < 0.0001 ? priceRange.min.toExponential(3) : priceRange.min.toFixed(6)} – \${priceRange.max < 0.0001 ? priceRange.max.toExponential(3) : priceRange.max.toFixed(6)}\\n\`
    : "";
  const coverageStr = rangeCoverage
    ? \`Range cover: \${fmtPct(rangeCoverage.downside_pct)} downside | \${fmtPct(rangeCoverage.upside_pct)} upside | \${fmtPct(rangeCoverage.width_pct)} total\\n\`
    : "";
  const poolStr = (binStep || baseFee)
    ? \`Bin step: \${binStep ?? "?"}  |  Base fee: \${baseFee != null ? baseFee + "%" : "?"}\\n\`
    : "";
  await sendHTML(
    \`✅ <b>Deployed</b> \${pair}\\n\` +
    \`Amount: \${amountSol} SOL\\n\` +
    priceStr +
    coverageStr +
    poolStr +
    \`Position: <code>\${position?.slice(0, 8)}...</code>\\n\` +
    \`Tx: <code>\${tx?.slice(0, 16)}...</code>\`
  );
}`;

const NEW_DEPLOY = `export async function notifyDeploy({ pair, amountSol, position, tx, priceRange, rangeCoverage, binStep, baseFee }) {
  if (hasActiveLiveMessage()) return;
  const priceStr = priceRange
    ? \`├ 💱 Range    : \${priceRange.min < 0.0001 ? priceRange.min.toExponential(3) : priceRange.min.toFixed(6)} – \${priceRange.max < 0.0001 ? priceRange.max.toExponential(3) : priceRange.max.toFixed(6)}\\n\`
    : "";
  const coverageStr = rangeCoverage
    ? \`├ 📐 Coverage  : ▼\${fmtPct(rangeCoverage.downside_pct)} ▲\${fmtPct(rangeCoverage.upside_pct)} (total \${fmtPct(rangeCoverage.width_pct)})\\n\`
    : "";
  const poolStr = (binStep || baseFee)
    ? \`├ ⚙️ Pool      : Bin \${binStep ?? "?"} | Fee \${baseFee != null ? baseFee + "%" : "?"}\\n\`
    : "";
  await sendHTML(
    \`🚀 <b>POSISI DIBUKA!</b>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`🎯 <b>\${pair}</b>\\n\` +
    \`├ 💰 Modal     : \${fmtSol(amountSol)}\\n\` +
    priceStr +
    coverageStr +
    poolStr +
    \`├ 📋 Posisi    : <code>\${position?.slice(0, 8)}...</code>\\n\` +
    \`└ 🔗 Tx        : <code>\${tx?.slice(0, 16)}...</code>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`✅ Agent berhasil deploy. Pantau terus!\`
  );
}`;

// ── Patch notifyClose ────────────────────────────────────────
const OLD_CLOSE = `export async function notifyClose({ pair, pnlUsd, pnlPct }) {
  if (hasActiveLiveMessage()) return;
  const sign = pnlUsd >= 0 ? "+" : "";
  await sendHTML(
    \`🔒 <b>Closed</b> \${pair}\\n\` +
    \`PnL: \${sign}$\${(pnlUsd ?? 0).toFixed(2)} (\${sign}\${(pnlPct ?? 0).toFixed(2)}%)\`
  );
}`;

const NEW_CLOSE = `export async function notifyClose({ pair, pnlUsd, pnlPct }) {
  if (hasActiveLiveMessage()) return;
  const sign = pnlUsd >= 0 ? "+" : "";
  const emoji = pnlEmoji(pnlPct ?? 0);
  const result = (pnlUsd ?? 0) >= 0 ? "PROFIT! 🎉" : "Rugi. Pelajaran berharga 📚";
  await sendHTML(
    \`🔒 <b>POSISI DITUTUP</b>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`🎯 <b>\${pair}</b>\\n\` +
    \`├ \${emoji} PnL USD  : \${sign}\${fmtUsd(pnlUsd)}\\n\` +
    \`├ 📊 PnL %    : \${sign}\${(pnlPct ?? 0).toFixed(2)}%\\n\` +
    \`└ 🏁 Hasil    : \${result}\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\`
  );
}`;

// ── Patch notifySwap ─────────────────────────────────────────
const OLD_SWAP = `export async function notifySwap({ inputSymbol, outputSymbol, amountIn, amountOut, tx }) {
  if (hasActiveLiveMessage()) return;
  await sendHTML(
    \`🔄 <b>Swapped</b> \${inputSymbol} → \${outputSymbol}\\n\` +
    \`In: \${amountIn ?? "?"} | Out: \${amountOut ?? "?"}\\n\` +
    \`Tx: <code>\${tx?.slice(0, 16)}...</code>\`
  );
}`;

const NEW_SWAP = `export async function notifySwap({ inputSymbol, outputSymbol, amountIn, amountOut, tx }) {
  if (hasActiveLiveMessage()) return;
  await sendHTML(
    \`🔁 <b>SWAP SELESAI</b>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`\${inputSymbol} ➜ \${outputSymbol}\\n\` +
    \`├ 📥 Masuk   : \${amountIn ?? "?"}\\n\` +
    \`├ 📤 Keluar  : \${amountOut ?? "?"}\\n\` +
    \`└ 🔗 Tx      : <code>\${tx?.slice(0, 16)}...</code>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\`
  );
}`;

// ── Patch notifyOutOfRange ───────────────────────────────────
const OLD_OOR = `export async function notifyOutOfRange({ pair, minutesOOR }) {
  if (hasActiveLiveMessage()) return;
  await sendHTML(
    \`⚠️ <b>Out of Range</b> \${pair}\\n\` +
    \`Been OOR for \${minutesOOR} minutes\`
  );
}`;

const NEW_OOR = `export async function notifyOutOfRange({ pair, minutesOOR }) {
  if (hasActiveLiveMessage()) return;
  const urgency = minutesOOR >= 60 ? "🔴 KRITIS!" : minutesOOR >= 30 ? "🟠 Waspada" : "🟡 Perhatian";
  await sendHTML(
    \`⚠️ <b>OUT OF RANGE!</b>\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`🎯 <b>\${pair}</b>\\n\` +
    \`├ ⏱ Durasi   : \${minutesOOR} menit\\n\` +
    \`└ 🚨 Status   : \${urgency}\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`💡 Agent akan ambil tindakan segera.\`
  );
}`;

// ── Apply patches ────────────────────────────────────────────
let patched = 0;

// Tambah helpers sebelum notifyDeploy
if (content.includes("export async function notifyDeploy")) {
  content = content.replace(
    "export async function notifyDeploy",
    HELPERS + "\nexport async function notifyDeploy"
  );
  patched++;
}

// Patch notifyDeploy
if (content.includes(OLD_DEPLOY)) {
  content = content.replace(OLD_DEPLOY, NEW_DEPLOY);
  patched++;
  console.log("\x1b[32m  ✓ notifyDeploy diperindah\x1b[0m");
} else {
  console.log("\x1b[33m  ! notifyDeploy tidak ditemukan, skip\x1b[0m");
}

// Patch notifyClose
if (content.includes(OLD_CLOSE)) {
  content = content.replace(OLD_CLOSE, NEW_CLOSE);
  patched++;
  console.log("\x1b[32m  ✓ notifyClose diperindah\x1b[0m");
} else {
  console.log("\x1b[33m  ! notifyClose tidak ditemukan, skip\x1b[0m");
}

// Patch notifySwap
if (content.includes(OLD_SWAP)) {
  content = content.replace(OLD_SWAP, NEW_SWAP);
  patched++;
  console.log("\x1b[32m  ✓ notifySwap diperindah\x1b[0m");
} else {
  console.log("\x1b[33m  ! notifySwap tidak ditemukan, skip\x1b[0m");
}

// Patch notifyOutOfRange
if (content.includes(OLD_OOR)) {
  content = content.replace(OLD_OOR, NEW_OOR);
  patched++;
  console.log("\x1b[32m  ✓ notifyOutOfRange diperindah\x1b[0m");
} else {
  console.log("\x1b[33m  ! notifyOutOfRange tidak ditemukan, skip\x1b[0m");
}

// ── Simpan ───────────────────────────────────────────────────
fs.writeFileSync(TELEGRAM_PATH, content);

console.log(`\n\x1b[32m\x1b[1m  ✓ Patch selesai! \x1b[0m`);
console.log(`\x1b[2m  → Backup ada di telegram.js.backup (restore: cp telegram.js.backup telegram.js)\x1b[0m`);
console.log(`\n\x1b[36m  Restart agent:\x1b[0m`);
console.log(`  \x1b[36mnpm run dev\x1b[0m\n`);
