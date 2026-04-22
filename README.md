# 📅 Agenda PWA

Uma agenda pessoal mobile-first, instalável como app, com dados guardados localmente.

## ✨ Funcionalidades

- **3 vistas**: Semana, Dia, Mês
- **Eventos com hora**: cria eventos com hora de início e fim
- **Categorias com cores**: organiza eventos por categoria
- **Drag & drop**: arrasta eventos para mudar a hora (vistas semana/dia)
- **Pesquisa**: pesquisa eventos por título ou descrição
- **Lembretes**: notificações push no browser
- **Exportar .ics**: compatível com Google Calendar, Apple Calendar, Outlook
- **PWA instalável**: instala no ecrã inicial do iPhone/Android
- **Offline**: funciona sem internet após a primeira visita
- **Persistência**: todos os dados ficam guardados no dispositivo (localStorage)

## 🚀 Deploy no GitHub Pages

1. Coloca todos os ficheiros na raiz do teu repositório (ou pasta `/docs`)
2. Vai a **Settings → Pages** e define a source como `main` branch / root
3. A app fica disponível em `https://[username].github.io/[repo]/`

## 📱 Instalar no telemóvel

### Android (Chrome)
- Abre a app no Chrome
- Aparece um banner "Adicionar ao ecrã inicial" — aceita
- Ou: menu (⋮) → "Instalar app"

### iPhone (Safari)
- Abre a app no Safari
- Toca em **Partilhar** (ícone de caixa com seta)
- Seleciona **"Adicionar ao ecrã de início"**

Após instalar, a app abre como uma app nativa, sem barra do browser. Os dados ficam guardados mesmo fechando a app.

## 📁 Estrutura de ficheiros

```
index.html      — estrutura HTML
style.css       — estilos (mobile-first)
app.js          — lógica da aplicação
manifest.json   — configuração PWA
sw.js           — service worker (offline)
icons/
  icon-192.png  — ícone da app
  icon-512.png  — ícone da app (grande)
```

## 🔔 Notificações

As notificações funcionam enquanto o browser estiver em execução em background.  
No iOS (Safari), as notificações push só funcionam quando a app está instalada no ecrã inicial.

## 💾 Dados

Todos os dados (eventos, categorias, preferências) são guardados no `localStorage` do browser.  
Para fazer backup, usa a função **Exportar .ics** no menu lateral.

## 📤 Importar para Google Calendar

1. Exporta o ficheiro `.ics` pela app
2. No Google Calendar (web): Definições → Importar → seleciona o ficheiro `.ics`
