export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
};

export type PasswordStrengthLevel = 0 | 1 | 2 | 3;

export type PasswordStrength = {
  checks: PasswordChecks;
  passedCount: number;
  /** 0 = vazia, 1 = fraca, 2 = média, 3 = forte (para colorir a barra). */
  level: PasswordStrengthLevel;
  label: string;
  /** Verdadeiro quando todos os 5 critérios são atendidos. */
  isValid: boolean;
};

export const PASSWORD_CRITERIA: { key: keyof PasswordChecks; label: string }[] = [
  { key: "length", label: "Ao menos 8 caracteres" },
  { key: "upper", label: "Uma letra maiúscula" },
  { key: "lower", label: "Uma letra minúscula" },
  { key: "number", label: "Um número" },
  { key: "symbol", label: "Um símbolo" },
];

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const isValid = passedCount === 5;

  let level: PasswordStrengthLevel = 0;
  let label = "";

  if (password.length > 0) {
    if (passedCount <= 2) {
      level = 1;
      label = "Fraca";
    } else if (passedCount <= 4) {
      level = 2;
      label = "Média";
    } else {
      level = 3;
      label = "Forte";
    }
  }

  return { checks, passedCount, level, label, isValid };
}
