# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# nginx:alpine's docker-entrypoint.sh automatically runs envsubst on *.template files
# and outputs them to /etc/nginx/conf.d/ before starting nginx
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
# Use the default nginx CMD — entrypoint handles template substitution
CMD ["nginx", "-g", "daemon off;"]
