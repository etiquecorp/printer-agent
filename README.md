<p align="center">
  <img src=".github/logo.svg" alt="Etique" width="260" />
</p>

<h3 align="center">Agente de Impressão Etiquê</h3>

<p align="center">
  Agente de impressão local do Etique, um SaaS de etiquetagem de validade para restaurantes.
</p>

---

## Sobre o projeto

O Etique ajuda restaurantes a controlar a validade dos itens manipulados na cozinha: cada
unidade cadastra seu catálogo de itens (com condições de armazenamento — ambiente,
refrigerado, congelado — e o prazo de validade de cada uma) e gera etiquetas com a data de
vencimento calculada automaticamente pelo [painel web](https://github.com/etiquecorp/web).

Este repositório é o **Agente de Impressão Etiquê**: um app desktop (Electron) instalado no computador do
restaurante. Ao abrir, o usuário faz login com sua conta Etique e escolhe o local ao qual aquele
computador pertence — o agente se registra nesse local e fica pareado com ele. A partir daí,
fica escutando via WebSocket os pedidos de impressão vindos do painel e repassa cada etiqueta
pra uma impressora térmica Zebra conectada localmente, via BrowserPrint.

## Stack

- Electron + electron-vite
- React + TypeScript
- Tailwind CSS + Radix UI (shadcn)

## Requisitos

- Node.js 22+
- [Zebra Browser Print](https://www.zebra.com/us/en/support-downloads/printer-software/browser-print.html)
  instalado e rodando na máquina (é o driver local que expõe as impressoras Zebra pra qualquer
  app, incluindo o agente)
- A [API do Etique](https://github.com/etiquecorp/service) rodando e acessível (local ou um
  ambiente de dev) — o agente se conecta nela pra autenticar, registrar o dispositivo no local
  escolhido e receber os pedidos de impressão

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Suba o app em modo desenvolvimento:

   ```bash
   npm run dev
   ```

3. Confirme em Configurações a URL da API (padrão `http://localhost:8080`) e do BrowserPrint
   (padrão `http://localhost:9100`), faça login com uma conta Etique e selecione o local — o
   agente se registra automaticamente nele.

## Build

```bash
npm run build:win     # instalador Windows
npm run build:mac     # instalador macOS
npm run build:linux   # instalador Linux
```

O CI (`.github/workflows/build.yml`) gera automaticamente o instalador Windows e publica como
release no GitHub a cada merge em `main` (release) ou `develop` (prerelease rolling).
