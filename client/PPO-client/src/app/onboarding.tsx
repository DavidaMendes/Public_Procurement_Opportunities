import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { onboardingPreferences } from "@/services/preferences/onboardingPreferences";
import { theme } from "@/theme";

const slides = [
  {
    eyebrow: "Oportunidades",
    title: "Encontre licitações públicas para MEIs",
    description:
      "Acompanhe oportunidades tratadas pela API própria do projeto, sem depender de consultas manuais ao PNCP.",
  },
  {
    eyebrow: "Clareza",
    title: "Entenda requisitos com mais segurança",
    description:
      "Veja informações organizadas para interpretar prazos, critérios e exigências da Lei nº 14.133/2021.",
  },
  {
    eyebrow: "Organização",
    title: "Prepare documentos, prazos e propostas",
    description:
      "Centralize o que precisa ser acompanhado para decidir melhor onde competir e como se preparar.",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  const progressLabel = useMemo(
    () => `${currentSlideIndex + 1} de ${slides.length}`,
    [currentSlideIndex],
  );

  async function goToAuth() {
    await onboardingPreferences.setCompleted(true);
    router.replace("/(auth)/login");
  }

  function handleNext() {
    if (isLastSlide) {
      goToAuth();
      return;
    }

    setCurrentSlideIndex((index) => index + 1);
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.progress}>{progressLabel}</Text>
          <Pressable accessibilityRole="button" onPress={goToAuth} hitSlop={12}>
            <Text style={styles.skip}>Pular</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{slide.eyebrow}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((item, index) => (
              <View
                key={item.title}
                style={[styles.dot, index === currentSlideIndex && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button title={isLastSlide ? "Começar" : "Avançar"} onPress={handleNext} />
            <Button
              title="Criar conta"
              onPress={async () => {
                await onboardingPreferences.setCompleted(true);
                router.push("/(auth)/register");
              }}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progress: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  skip: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.successSurface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  badgeText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "800",
    lineHeight: 38,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  footer: {
    gap: theme.spacing.xl,
  },
  dots: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: theme.colors.primary,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
