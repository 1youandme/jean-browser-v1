FROM node:18-alpine
WORKDIR /app
COPY package.json /app/
RUN npm install --only=production
COPY server.js /app/server.js
EXPOSE 8787
CMD ["node","server.js"]
