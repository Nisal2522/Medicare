FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Defaults suit docker-compose (browser → host-published ports). For Ingress, rebuild with /api/* prefixes.
ARG VITE_API_URL=http://localhost:3002
ARG VITE_APPOINTMENT_API_URL=http://localhost:3003
ARG VITE_DOCTOR_API_URL=http://localhost:3000
ARG VITE_PATIENT_API_URL=http://localhost:3004
ARG VITE_TELEMEDICINE_API_URL=http://localhost:3005
ARG VITE_AI_API_URL=http://localhost:3006
ARG VITE_PAYMENT_API_URL=http://localhost:3007
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APPOINTMENT_API_URL=$VITE_APPOINTMENT_API_URL
ENV VITE_DOCTOR_API_URL=$VITE_DOCTOR_API_URL
ENV VITE_PATIENT_API_URL=$VITE_PATIENT_API_URL
ENV VITE_TELEMEDICINE_API_URL=$VITE_TELEMEDICINE_API_URL
ENV VITE_AI_API_URL=$VITE_AI_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
