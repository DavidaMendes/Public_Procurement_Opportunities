# Builds e demonstrações executáveis

## Demonstração local com Expo Go

Pré-requisitos:

- Node.js instalado.
- Dependências instaladas com `npm install`.
- Aplicativo Expo Go instalado no celular.
- Celular e computador na mesma rede.
- API disponível em endereço acessível pelo celular.

Comandos:

```bash
cd client/PPO-client
EXPO_PUBLIC_API_BASE_URL=http://SEU_IP_LOCAL:8000 npm start
```

Depois:

1. Leia o QR Code com o Expo Go.
2. Faça login ou cadastro.
3. Acesse oportunidades.
4. Abra o detalhe de uma contratação.
5. Salve o edital.
6. Confira o dashboard.
7. Configure alerta.
8. Consulte documentos.

## Demonstração web para validação rápida

```bash
cd client/PPO-client
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 npm run web
```

Uso recomendado: validação rápida de layout, navegação, estados de tela e integração local com a API.

Evidência local em 2026-06-17:

- `npm run web` iniciou o Expo.
- A porta `8081` já estava ocupada, então a demonstração ficou em `http://localhost:8082`.
- `curl -I http://localhost:8082` retornou `HTTP/1.1 200 OK`.
- O Metro também exibiu QR Code para abertura pelo Expo Go em rede local.

## Build nativo recomendado com EAS

O repositório ainda não possui `eas.json`. Para gerar build instalável de preview, criar:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Comandos sugeridos:

```bash
cd client/PPO-client
npx eas login
npx eas build:configure
npx eas build --platform android --profile preview
```

## Critério de aceite da demonstração

- O app abre em dispositivo real via Expo Go ou APK.
- O fluxo inicial redireciona corretamente entre onboarding, login e área autenticada.
- A API configurada responde no dispositivo.
- As telas de oportunidades, detalhe, dashboard, alertas e documentos são navegáveis.
- Estados de erro são compreensíveis quando a API está indisponível.
