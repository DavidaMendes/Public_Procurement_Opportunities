import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme";
import type { ChecklistItem, ChecklistKey } from "@/types/checklist";

type ContratacaoChecklistProps = {
  items: ChecklistItem[];
  progress: number;
  onToggleItem: (key: ChecklistKey) => void;
};

export function ContratacaoChecklist({
  items,
  progress,
  onToggleItem,
}: ContratacaoChecklistProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.sectionTitle}>Checklist de preparo</Text>
          <Text style={styles.description}>
            Marque os itens concluídos antes de avançar com a oportunidade.
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.items}>
        {items.map((item) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.completed }}
            key={item.key}
            onPress={() => onToggleItem(item.key)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{item.label}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  progressBadge: {
    minWidth: 56,
    alignItems: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.successSurface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  progressText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceMuted,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  items: {
    gap: theme.spacing.sm,
  },
  item: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  itemPressed: {
    opacity: 0.82,
  },
  checkbox: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  itemText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontWeight: "800",
    lineHeight: 20,
  },
  itemDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
});
