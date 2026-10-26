# AGENTS.md

本文件提供給 AI 代理（Claude Code、Codex、Copilot 等）與新加入的開發者，說明本專案的目標、技術棧、結構與工作慣例。

## 專案目標

**DevToys Web** —— 以 Vue 3 臨摹 [DevToys](https://github.com/DevToys-app/DevToys)（開發者的瑞士刀）的網頁版本。
所有工具皆在瀏覽器端執行，不需要後端，不上傳任何資料。

設計方向：

- 版面遵循 DevToys 2.0 的資訊架構：左側導覽（搜尋、所有工具、最愛、分類群組）＋ 右側內容（首頁工具卡片網格 / 工具頁）。
- 視覺採「明亮乾淨」：淺色優先、帶極淡水藍（藍中帶綠）調的白色表面與邊框、單一明亮天空藍強調色、字體使用 Noto Sans / Noto Sans TC、不用漸層／發光／裝飾背景，等寬字體用於輸入輸出。
- 簡潔乾淨、符合線上工具網站的排版，支援 RWD（手機抽屜式側欄、平板與桌機雙欄）。
- 支援淺色 / 深色 / 跟隨系統主題，以及 en / zh-TW 介面語言。

## 技術棧

| 項目 | 選型 |
| --- | --- |
| 框架 | Vue 3（`<script setup lang="ts">`，Composition API） |
| 建置 | Vite |
| 樣式 | Tailwind CSS v4（CSS-first 設定於 `src/style.css`，無 `tailwind.config.js`） |
| 路由 | vue-router（hash 模式不需伺服器設定，部署於靜態空間） |
| 圖示 | lucide-vue-next |
| 型別 | TypeScript（`vue-tsc` 檢查） |

工具實作使用的瀏覽器端函式庫（皆為純前端）：`js-yaml`、`cron-parser`、`cronstrue`、`sql-formatter`、`xml-formatter`、`marked` + `dompurify`、`diff`、`qrcode`、`jsqr`、`pako`、`hash-wasm`、`uuid`、`jsonpath-plus`、`jose`、`@peculiar/x509`、`figlet`、`@xdadda/mini-gl`（WebGL2 相片濾鏡）。

## 目錄結構

```
src/
  main.ts                 進入點
  App.vue                 版面殼層（側欄 + 內容區）
  style.css               Tailwind 入口、設計 token（色彩、字體）、全域樣式
  router/                 路由定義（/、/group/:id、/tool/:id、/settings）
  i18n/                   極簡 i18n（en、zh-TW 字典 + useI18n）
  composables/            useTheme、useSettings、useFavorites、useClipboard 等
  components/
    layout/               Sidebar、TopBar、ToolCard、ToolGrid ...
    ui/                   Button、Switch、Select、NumberInput、CodeEditor、SettingCard、InfoBar ...
  tools/
    registry.ts           工具與群組的註冊表（id、群組、圖示、懶載入元件、搜尋關鍵字）
    converters/           Cron、Date、JsonTable、JsonYaml、NumberBase、Unicode
    encoders/             Base64Text、Base64Image、Certificate、GZip、Html、Jwt、QrCode、Url
    formatters/           Json、Sql、Xml
    generators/           AsciiArt、Hash、LoremIpsum、Password、Uuid
    graphic/              ColorBlindness、ImageConverter、TriangleGradient、BoxShadow、PhotoEditor
    testers/              JsonPath、RegEx、Xml
    text/                 Analyzer、Compare、EscapeUnescape、ListCompare、MarkdownPreview
  pages/                  HomePage、GroupPage、ToolPage、SettingsPage
```

## 新增一個工具

1. 在 `src/tools/<group>/` 新增 `XxxTool.vue`。版面慣例：上方「Configuration」設定卡片區（`SettingCard`），下方輸入 / 輸出編輯器（`CodeEditor`），雙欄在 `lg` 以上並排、以下堆疊。
2. 在 `src/i18n/locales/en.ts` 與 `zh-TW.ts` 的 `tools.<id>` 加入 `title`、`short`、`description`、`keywords` 與工具內字串。
3. 在 `src/tools/registry.ts` 註冊：`id`、`group`、`icon`、`component: () => import(...)`。
4. 運算邏輯放在同資料夾的純函式模組 `xxx.ts`（不依賴 Vue / i18n，錯誤以代碼回傳，由 `.vue` 對應成 `tt(...)` 訊息），並撰寫同層的 `xxx.test.ts`（Vitest；需要 DOM 時在檔案首行加 `// @vitest-environment jsdom`）。
5. 執行 `npm test` 與 `npm run build` 確認測試、型別與打包無誤。

## 指令

```bash
npm install        # 安裝依賴
npm run dev        # 開發伺服器
npm run build      # vue-tsc 型別檢查 + 生產打包
npm test           # Vitest 單元測試（npm run test:watch 為監看模式）
npm run preview    # 預覽 dist
```

## 慣例

- 元件一律 `<script setup lang="ts">`；狀態以 `ref`/`computed`，避免引入額外狀態管理。
- 不使用 `any`，可用 `unknown` + 型別縮小。
- 所有使用者可見字串走 i18n（`t('...')`），不可硬編碼中文或英文。
- 顏色只用 `src/style.css` 中定義的 token（`bg-surface`、`text-fg`、`border-line`、`text-accent` 等），不要直接用 Tailwind 的 `slate-800` 之類色票，以確保深淺主題一致。
- 工具運算必須在瀏覽器端完成；不得呼叫外部 API。
- Commit 訊息採 Conventional Commits（`feat:`、`fix:`、`chore:`、`style:`、`docs:`、`refactor:`），一個 commit 對應一個完整、可建置的步驟。

## 參考

- DevToys 原始碼：<https://github.com/DevToys-app/DevToys>（應用程式殼層）、<https://github.com/DevToys-app/DevToys.Tools>（30 個內建工具）。
- 工具標題、描述與介面字串皆對照 DevToys 的 `.resx`（en / zh-Hant）翻譯。
