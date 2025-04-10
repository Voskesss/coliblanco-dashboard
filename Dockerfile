# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Kopieer package.json en package-lock.json
COPY package*.json ./

# Installeer dependencies
RUN npm ci

# Kopieer de rest van de code
COPY . .

# Bouw de applicatie
RUN npm run build

# Production stage
FROM nginx:alpine

# Kopieer de gebouwde bestanden naar de nginx server
COPY --from=build /app/dist /usr/share/nginx/html

# Kopieer nginx configuratie
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose poort 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
