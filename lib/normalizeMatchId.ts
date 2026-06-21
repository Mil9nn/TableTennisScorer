/**
 * Resolves a match id from API / route params into a stable 24-char hex string when possible.
 * Handles Expo `useLocalSearchParams` returning `string | string[]`.
 */

function tryHexFromByteArray(bytes: number[]): string | null {
  if (bytes.length !== 12) return null;
  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return null;
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function objectValuesAsBytes(obj: Record<string, unknown>): number[] | null {
  const keys = Object.keys(obj).sort((a, b) => Number(a) - Number(b));
  if (keys.length !== 12) return null;
  if (!keys.every((k, idx) => k === String(idx))) return null;
  const bytes = keys.map((k) => Number(obj[k]));
  return bytes.every((n) => Number.isFinite(n)) ? bytes : null;
}

function normalizeIdObject(obj: Record<string, unknown>): string | null {
  if (typeof (obj as any).toHexString === "function") {
    try {
      const hex = (obj as any).toHexString();
      if (typeof hex === "string" && hex.length) return hex;
    } catch {
      // ignore
    }
  }

  if (typeof obj.$oid === "string" && obj.$oid.length) return obj.$oid;

  if (obj.buffer && typeof obj.buffer === "object") {
    const bufferObj = obj.buffer as Record<string, unknown>;
    if (Array.isArray(bufferObj.data)) {
      const bytes = bufferObj.data.map((v) => Number(v));
      const hex = tryHexFromByteArray(bytes);
      if (hex) return hex;
    }
    const maybeBytes = objectValuesAsBytes(bufferObj);
    if (maybeBytes) {
      const hex = tryHexFromByteArray(maybeBytes);
      if (hex) return hex;
    }
  }

  if (obj.type === "Buffer" && Array.isArray(obj.data)) {
    const bytes = obj.data.map((v) => Number(v));
    const hex = tryHexFromByteArray(bytes);
    if (hex) return hex;
  }

  const maybeBytes = objectValuesAsBytes(obj);
  if (maybeBytes) {
    const hex = tryHexFromByteArray(maybeBytes);
    if (hex) return hex;
  }

  return null;
}

export function normalizeMatchIdParam(raw: unknown): string {
  if (raw == null) return "";
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const id = normalizeMatchIdParam(item);
      if (id) return id;
    }
    return "";
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    return t && t !== "[object Object]" ? t : "";
  }
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (o._id != null) {
      const nested = normalizeMatchIdParam(o._id);
      if (nested) return nested;
    }
    if (o.id != null) {
      const nested = normalizeMatchIdParam(o.id);
      if (nested) return nested;
    }
    const fromShape = normalizeIdObject(o);
    if (fromShape) return fromShape;
    if (typeof (raw as any).toString === "function") {
      const s = String((raw as any).toString());
      if (s && s !== "[object Object]") return s;
    }
  }
  const s = String(raw);
  return s !== "[object Object]" ? s : "";
}
