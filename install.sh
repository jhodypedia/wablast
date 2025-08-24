#!/bin/bash

# Init npm
echo "📄 Inisialisasi package.json ..."
npm init -y > /dev/null

# Install dependencies
echo "📥 Menginstall dependencies ..."
npm install express express-ejs-layouts ejs bcrypt jsonwebtoken cookie-parser \
  @whiskeysockets/baileys qrcode sqlite3 multer csv-parse socket.io pino pino-pretty

# Install dev dependencies
npm install --save-dev nodemon

# Buat .gitignore
echo "🛡 Membuat .gitignore ..."
cat > .gitignore <<EOL
# Node modules
node_modules/

# Env file
.env

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# SQLite
*.sqlite
*.sqlite-journal

# Baileys sessions
sessions/
auth_info*

# Build
dist/
build/

# OS / Editor
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
EOL

# Buat .env default
echo "🔑 Membuat .env ..."
cat > .env <<EOL
JWT_SECRET=supersecretjwt
PORT=3000
DATABASE=database.sqlite
EOL

# Tambah script ke package.json
echo "⚙️ Update package.json ..."
npx json -I -f package.json -e '
this.scripts = {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
'

echo "✅ Instalasi selesai!"
echo "➡ Jalankan project dengan:"
echo "   cd $PROJECT_NAME"
echo "   npm run dev"
