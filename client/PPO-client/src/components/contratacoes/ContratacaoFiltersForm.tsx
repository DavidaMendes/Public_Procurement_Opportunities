import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { hasContratacaoFilters } from "@/services/contratacoes/contratacaoFilters";
import { theme } from "@/theme";
import type { ContratacaoFilters } from "@/types/contratacao";

type ContratacaoFiltersFormProps = {
  filters: ContratacaoFilters;
  isFiltering: boolean;
  onApply: () => void;
  onChange: (filters: ContratacaoFilters) => void;
  onClear: () => void;
};

export function ContratacaoFiltersForm({
  filters,
  isFiltering,
  onApply,
  onChange,
  onClear,
}: ContratacaoFiltersFormProps) {
  const canClear = hasContratacaoFilters(filters) || isFiltering;

  function updateFilter(key: keyof ContratacaoFilters, value: string) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <View style={styles.container}>
      <TextField
        autoCapitalize="none"
        label="Buscar"
        onChangeText={(value) => updateFilter("q", value)}
        placeholder="Objeto da contratacao"
        value={filters.q ?? ""}
      />

      <View style={styles.compactRow}>
        <View style={styles.ufField}>
          <TextField
            autoCapitalize="characters"
            label="UF"
            onChangeText={(value) => updateFilter("uf", value.slice(0, 2))}
            placeholder="PE"
            value={filters.uf ?? ""}
          />
        </View>

        <View style={styles.valueField}>
          <TextField
            keyboardType="numeric"
            label="Valor min."
            onChangeText={(value) => updateFilter("valorMin", value)}
            placeholder="0"
            value={filters.valorMin ?? ""}
          />
        </View>
      </View>

      <TextField
        keyboardType="numeric"
        label="Valor max."
        onChangeText={(value) => updateFilter("valorMax", value)}
        placeholder="80000"
        value={filters.valorMax ?? ""}
      />

      <View style={styles.actions}>
        <Button title="Aplicar filtros" onPress={onApply} />
        <Button disabled={!canClear} title="Limpar" onPress={onClear} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  compactRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  ufField: {
    flex: 0.75,
    minWidth: 84,
  },
  valueField: {
    flex: 1.25,
    minWidth: 0,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
