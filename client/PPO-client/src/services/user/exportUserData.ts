import { Platform, Share } from "react-native";

import type { MeResponse } from "@/types/user";

const FILE_NAME = "meus-dados.json";

/**
 * Exporta os dados do titular (GET /users/me) em JSON.
 * - Web: dispara o download de um arquivo .json.
 * - Mobile: abre a folha de compartilhamento nativa com o conteúdo.
 */
export async function exportUserData(data: MeResponse) {
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = FILE_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: FILE_NAME,
    message: json,
  });
}
