# 浪浪小小守護者（Stray Pals Kids）

給台灣國小學生的動物生命教育與公立收容所認養資訊網站。孩子可以閱讀知識卡、玩情境測驗、查看政府公開認養資訊，並將「給爸媽看的領養小卡」帶回家討論。

網站免註冊、免登入，不要求真實姓名、電話或 Email。關注清單與闖關徽章只保存在使用者自己的瀏覽器 `localStorage`。證書暱稱只在目前頁面產生證書時使用，不會送到伺服器或保存。

## 專案結構

```text
浪浪APP/
├── .gitignore
├── README.md
├── requirements.txt
├── vercel.json
├── api/
│   └── index.py              # Flask app、頁面路由與農業部資料代理
├── data/
│   └── content.json          # 四大知識主題與八道測驗題
├── static/
│   ├── css/style.css
│   └── js/
│       ├── app.js            # localStorage 收藏、導覽與通用互動
│       ├── adopt.js          # 認養查詢、收藏與家長資訊卡
│       └── quiz.js           # 測驗、徽章與數位證書
└── templates/
    ├── base.html
    ├── index.html
    ├── adopt.html
    ├── knowledge.html
    └── quiz.html
```

## 本機啟動

需要 Python 3.10 或更新版本。Windows PowerShell：

```powershell
cd C:\Codex\浪浪APP
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m api.index
```

macOS/Linux：

```bash
cd 浪浪APP
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m api.index
```

開啟 <http://127.0.0.1:5000>。首頁、知識學院、領養查詢及闖關頁分別是 `/`、`/knowledge`、`/adopt`、`/quiz`。動物資料由 `/api/animals` 代理。外部請求設有 8 秒逾時；相同條件的成功結果會在 Flask 執行個體記憶體中快取 10 分鐘。Serverless 執行個體可能隨時回收，因此快取不保證跨執行個體保留。

## GitHub 初始化與推送

在 GitHub 建立一個空白 repository（建議不要先加入 README 或其他初始化檔），接著在專案根目錄執行：

```bash
git init
git add .
git commit -m "建立浪浪小小守護者網站"
git branch -M main
git remote add origin https://github.com/你的帳號/你的repository.git
git push -u origin main
```

若 repository 已有遠端，先用 `git remote -v` 確認，再設定正確的 `origin`；不要重複新增同名 remote。

## Vercel 部署

1. 將專案推送到 GitHub。
2. 登入 [Vercel](https://vercel.com/)，選擇 **Add New → Project**，授權並匯入剛推送的 repository。
3. Framework Preset 選 **Other**。專案根目錄使用預設值 `.`；不需要設定 Build Command 或 Output Directory。
4. 確認根目錄有 `vercel.json` 與 `requirements.txt`，然後按 **Deploy**。`vercel.json` 會使用 `@vercel/python` 建置 `api/index.py`，並將所有路徑送至 Flask app。
5. 部署完成後開啟提供的 `.vercel.app` 網址，確認首頁、`/knowledge`、`/adopt`、`/quiz` 都可開啟。
6. 在領養頁確認 API 能顯示資料，並試用篩選、收藏和「給爸媽看」資訊卡；測驗答題完成後確認證書可產生。
7. 後續推送到 GitHub `main` 分支，Vercel 會依 Git 整合自動建立新部署。

## 部署前檢查清單

- [ ] `vercel.json`、`requirements.txt` 位於 repository 根目錄。
- [ ] Vercel 專案 Root Directory 是 repository 根目錄，Python runtime 建置成功。
- [ ] 四個頁面與靜態 CSS/JavaScript 都能載入。
- [ ] `/api/animals` 成功時回傳 JSON；上游服務故障時回傳友善訊息與 503，不輸出 traceback。
- [ ] 手機尺寸可瀏覽；收藏及徽章留在瀏覽器端。
- [ ] 認養聯絡與條件提示家長確認；網站沒有註冊表單或個人資料欄位。

## 資料來源與注意事項

領養資料來自農業部「動物認領養」OpenData（`UnitId=QcbUEzN6E6DL`）。資料會更新、欄位也可能缺漏；網站只顯示有 HTTP/HTTPS 照片網址的項目。照片、收容編號、電話及地址仍應由家長向收容所確認。若服務暫時不可用，頁面會提示稍後再試。

此專案以輕量 Flask app、requests 與原生 JavaScript 建置，不使用資料庫。Tailwind CSS 透過 CDN 載入；因此瀏覽器需能連線到 Tailwind CDN 才會套用工具類別樣式。部署 Vercel 時請使用其支援的 Python Functions runtime。
