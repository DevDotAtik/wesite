import dns from "dns";

// Private and reserved IPv4 address ranges
const PRIVATE_IPV4_RANGES = [
  // 127.0.0.0/8 (Loopback)
  { start: 0x7f000000, end: 0x7fffffff },
  // 10.0.0.0/8 (Private)
  { start: 0x0a000000, end: 0x0affffff },
  // 172.16.0.0/12 (Private)
  { start: 0xac100000, end: 0xac1fffff },
  // 192.168.0.0/16 (Private)
  { start: 0xc0a80000, end: 0xc0a8ffff },
  // 169.254.0.0/16 (Link-Local / Cloud Metadata)
  { start: 0xa9fe0000, end: 0xa9feffff },
  // 0.0.0.0/8 (Current network / "this host")
  { start: 0x00000000, end: 0x00ffffff },
  // 100.64.0.0/10 (Carrier-grade NAT)
  { start: 0x64400000, end: 0x647fffff },
  // 198.18.0.0/15 (Benchmarking)
  { start: 0xc6120000, end: 0xc613ffff },
  // 224.0.0.0/4 (Multicast)
  { start: 0xe0000000, end: 0xefffffff },
  // 240.0.0.0/4 (Reserved)
  { start: 0xf0000000, end: 0xffffffff },
];

function ipToLong(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const num = ipToLong(ip);
  if (num === null) return true; // Malformed IPs are unsafe
  return PRIVATE_IPV4_RANGES.some((range) => num >= range.start && num <= range.end);
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Loopback
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1" || lower === "::") return true;
  // Unique local addresses (fc00::/7)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // Link-local (fe80::/10)
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (lower.includes("::ffff:")) {
    const after = lower.split("::ffff:")[1];
    if (after.includes(".")) {
      return isPrivateIPv4(after);
    }
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    return isPrivateIPv6(ip);
  }
  return isPrivateIPv4(ip);
}

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
  /\.corp$/i,
  /\.home$/i,
  /\.test$/i,
  /\.example$/i,
  /\.invalid$/i,
  /\.onion$/i,
  /^metadata\.google\.internal$/i,
  /^metadata$/i,
  /^instance-data$/i,
];

/**
 * Validates that a target URL is a safe, publicly-routable HTTP/HTTPS address.
 * Defends against SSRF, loopback access, link-local cloud metadata endpoints,
 * private networks, and DNS rebinding / nip.io tricks.
 */
export async function isSafePublicUrl(rawUrl: string): Promise<{ safe: boolean; reason?: string }> {
  let parsed: URL;

  try {
    const trimmed = rawUrl.trim();
    // If a scheme is already provided, parse directly
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      parsed = new URL(trimmed);
    } else {
      parsed = new URL(`https://${trimmed}`);
    }
  } catch {
    return { safe: false, reason: "Malformed URL" };
  }

  // 1. Only allow HTTP and HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject empty or invalid hostnames
  if (!hostname || hostname.length > 253) {
    return { safe: false, reason: "Invalid hostname" };
  }

  // 3. Reject known private host patterns
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, reason: `Blocked hostname: ${hostname}` };
    }
  }

  // 4. If hostname is directly an IP, verify IP ranges
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":")) {
    if (isPrivateIp(hostname)) {
      return { safe: false, reason: `Private/reserved IP blocked: ${hostname}` };
    }
  }

  // 5. Resolve hostname via DNS and check all returned IP addresses
  try {
    const resolved = await dns.promises.lookup(hostname, { all: true });
    if (!resolved || resolved.length === 0) {
      return { safe: false, reason: "Hostname could not be resolved" };
    }

    for (const record of resolved) {
      if (isPrivateIp(record.address)) {
        return { safe: false, reason: `Resolved to private address: ${record.address}` };
      }
    }
  } catch {
    // If DNS resolution fails, allow fallback behavior if it is not an IP
    // but reject if it was clearly unresolvable
    return { safe: false, reason: "DNS resolution failed" };
  }

  return { safe: true };
}
