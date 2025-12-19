# Usa Node.js 20
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o código
COPY . .

# Expõe a porta (não estritamente necessária para bot Discord)
EXPOSE 3000

# Comando para iniciar o bot
CMD ["node", "index.js"]
