# DevToys Web

以 Vue 3 + Vite + Tailwind CSS 重現 [DevToys](https://github.com/DevToys-app/DevToys) 的網頁版本。
30 個開發者小工具全部在瀏覽器端執行，不需要後端、不上傳任何資料。

## 工具清單

| 群組 | 工具 |
| --- | --- |
| 轉換器 | Cron 表達式剖析、日期轉換（時間戳記 / 時區）、JSON 陣列轉表格（CSV / TSV）、JSON <> YAML、數值進位轉換、Unicode 字碼轉換（字元 ↔ 碼位 / UTF-8 / UTF-16 / NCR / 各語言跳脫） |
| 編碼 / 解碼 | Base64 文字、Base64 圖片、憑證解碼（X.509）、GZip、HTML、JWT（解碼 / 驗證 / 簽署）、QR 碼（產生 / 讀取）、URL |
| 格式化 | JSON、SQL（多種方言）、XML |
| 產生器 | 雜湊值 / 檢查碼（MD5、SHA1/256/384/512、CRC32、HMAC、檔案）、Lorem Ipsum、密碼、UUID（v1 / v4 / v7） |
| 圖形 | 色盲模擬、圖片轉檔（PNG / JPEG / WebP、縮放） |
| 測試 | JSONPath、正規表達式、XML / XSD 驗證 |
| 文字 | 文字分析與實用工具（統計、大小寫、排序）、文字比較（diff）、跳脫 / 取消跳脫、清單比較、Markdown 預覽 |

其他功能：工具搜尋、最愛與最近使用、淺色 / 深色 / 跟隨系統主題、英文 / 繁體中文介面、可收合側欄與手機抽屜式導覽（RWD）。

## 開發

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 型別檢查 + 打包到 dist/
npm run preview   # 預覽 dist/
```

打包結果為純靜態檔案（hash 路由），可直接部署到任何靜態空間。

## 專案結構與慣例

見 [AGENTS.md](AGENTS.md)。
