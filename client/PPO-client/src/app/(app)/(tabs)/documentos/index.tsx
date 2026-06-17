import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { documentTemplates } from "@/services/documents/documentTemplates";
import type { DocumentTemplate } from "@/types/documentTemplate";
import { theme } from "@/theme";

export default function DocumentosScreen() {
  const [query, setQuery] = useState("");
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
    };
  }, []);

  async function handleCopyTemplate(template: DocumentTemplate) {
    await Clipboard.setStringAsync(template.template);
    setCopiedTemplateId(template.id);

    if (copyResetTimeout.current) {
      clearTimeout(copyResetTimeout.current);
    }

    copyResetTimeout.current = setTimeout(() => {
      setCopiedTemplateId(null);
    }, 2000);
  }

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return documentTemplates;
    }

    return documentTemplates.filter((template) => {
      const searchableText = [
        template.title,
        template.requiredWhen,
        template.summary,
        template.format,
      ].join(" ").toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query]);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Templates</Text>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.description}>
            Consulte modelos de documentos para usar quando o edital exigir declarações, proposta ou comprovação técnica.
          </Text>
        </View>

        <TextField
          autoCapitalize="none"
          label="Buscar modelo"
          onChangeText={setQuery}
          placeholder="Ex.: proposta, regularidade, atestado"
          value={query}
        />

        <View style={styles.list}>
          {filteredTemplates.map((template) => {
            const isExpanded = expandedTemplateId === template.id;
            const isCopied = copiedTemplateId === template.id;

            return (
              <View key={template.id} style={styles.card}>
                <Text style={styles.cardTitle}>{template.title}</Text>

                <View style={styles.formatBadge}>
                  <Text style={styles.formatText}>{template.format}</Text>
                </View>

                <Text style={styles.summary}>{template.summary}</Text>

                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Quando usar</Text>
                  <Text style={styles.infoText}>{template.requiredWhen}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setExpandedTemplateId(isExpanded ? null : template.id);
                    }}
                    style={({ pressed }) => [
                      styles.templateButton,
                      styles.templateButtonExpand,
                      pressed && styles.templateButtonPressed,
                    ]}
                  >
                    <Text style={styles.templateButtonText}>
                      {isExpanded ? "Ocultar modelo" : "Ver modelo"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Copiar modelo: ${template.title}`}
                    onPress={() => handleCopyTemplate(template)}
                    style={({ pressed }) => [
                      styles.copyButton,
                      isCopied && styles.copyButtonDone,
                      pressed && styles.templateButtonPressed,
                    ]}
                  >
                    <Ionicons
                      name={isCopied ? "checkmark" : "copy-outline"}
                      size={18}
                      color={isCopied ? theme.colors.primaryDark : theme.colors.primary}
                    />
                    <Text style={styles.copyButtonText}>{isCopied ? "Copiado!" : "Copiar"}</Text>
                  </Pressable>
                </View>

                {isExpanded ? (
                  <View style={styles.templateBox}>
                    <Text style={styles.templateText}>{template.template}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum modelo encontrado</Text>
            <Text style={styles.emptyText}>
              Tente buscar por proposta, regularidade, habilitação ou atestado.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
    lineHeight: 22,
  },
  formatBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  formatText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  summary: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  infoBlock: {
    gap: theme.spacing.xs,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoText: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
  },
  templateButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  templateButtonExpand: {
    flex: 1,
  },
  templateButtonPressed: {
    opacity: 0.82,
  },
  templateButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    minHeight: 44,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
  },
  copyButtonDone: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.successSurface,
  },
  copyButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  templateBox: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.lg,
  },
  templateText: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    lineHeight: 22,
  },
  emptyCard: {
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
});
