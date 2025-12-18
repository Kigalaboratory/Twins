FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
