import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Match } from "@/types/match.type";
import type { MatchStatsData } from "@/hooks/useMatchStatsData";
import { buildMatchPdfPayload } from "./buildMatchPdfPayload";
import { renderMatchPdfHtml } from "./renderMatchPdfHtml";

export async function generateMatchPdfFile(
  match: Match,
  statsData: MatchStatsData
): Promise<string> {
  const payload = buildMatchPdfPayload(match, statsData);
  const html = renderMatchPdfHtml(payload);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return uri;
}

export async function shareMatchPdfFile(uri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Share Match Summary PDF",
  });
}
