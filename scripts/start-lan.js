#!/usr/bin/env node

const { spawn } = require("child_process");
const os = require("os");

async function getLanIp() {
  try {
    const { lanNetwork } = require("lan-network");
    const info = await lanNetwork({ probe: true });
    if (info?.address) return info.address;
  } catch {
    // Fall back to interface scan below.
  }

  const interfaces = os.networkInterfaces();
  const preferred = ["Wi-Fi", "WLAN", "Ethernet", "en0", "eth0"];

  for (const name of preferred) {
    for (const addr of interfaces[name] ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }

  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs) {
      if (
        addr.family === "IPv4" &&
        !addr.internal &&
        !addr.address.startsWith("169.254.")
      ) {
        return addr.address;
      }
    }
  }

  return "127.0.0.1";
}

async function main() {
  const ip = await getLanIp();
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
  console.log(`Using LAN IP: ${ip}`);
  console.log(`Connect in Expo Go: exp://${ip}:8081`);
  console.log("Run this in your own terminal (not a background task) to see the QR code.\n");

  const args = ["expo", "start", "--lan", ...process.argv.slice(2)];
  const child = spawn("npx", args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    cwd: process.cwd(),
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
