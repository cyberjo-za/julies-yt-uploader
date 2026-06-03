# Julies Attorneys - Video Intake Portal

This is a bespoke, enterprise-grade video submission system designed for Property Practitioners of **Julies Attorneys**. It allows authenticated users to securely stream high-definition media directly into the firm's YouTube Channel as unlisted assets.

## 🏗️ Architecture Overview

The system uses a fast, secure, serverless split-architecture:
1. **Frontend (Afrihost cPanel)**: Hosted at `https://video.juliesproperties.co.za`. It serves the graphical interface, handles drag-and-drop file validation, and initiates user authentication.
2. **Identity Provider (Microsoft Entra ID)**: Restricts access exclusively to authorized corporate domains or approved guest accounts using Microsoft 365 login.
3. **Secure API Boundary (Cloudflare Worker)**: Acts as a background gateway. It validates the user’s Microsoft token, exchanges secure developer keys with Google, and provides a direct upload link to Google's CDN.

---

## 🚀 Setup & Troubleshooting Guide

### 1. Frontend Deployment (Afrihost cPanel)
Upload the following root-level files to the subdomain directory (`/video`) using the cPanel File Manager:
* `index.html` - Main user interface.
* `.htaccess` - Security headers (HSTS, clickjacking prevention) and Content Security Policy (CSP).
* `brand.jpeg` - Full rectangular corporate logo.
* `fav.ico` - Browser tab icon.

#### Content Security Policy Note:
The site uses a strict `Content-Security-Policy` header in `.htaccess`. If you change the URL of the Cloudflare Worker, you **must** update the `connect-src` section in `.htaccess` to avoid blocking browser transfers.

---

### 2. Cloudflare Worker Deployment
The backend API runs as a Cloudflare Worker using the code found in `/backend/worker.js`.

#### Required Environment Variables:
Inside your Cloudflare Worker Dashboard under **Settings > Variables > Environment Variables**, you must define these secrets (do not hardcode them in the script!):

| Variable Name | Description | Source |
| :--- | :--- | :--- |
| `YT_CLIENT_ID` | Google Developer console OAuth Client ID | Google Cloud Console |
| `YT_CLIENT_SECRET` | Google Developer OAuth client secret key | Google Cloud Console |
| `YT_REFRESH_TOKEN` | Permanent Google offline access refresh token | Google OAuth Playground |

---

### 3. Microsoft Authentication
Microsoft login relies on Entra ID App Registration.
* **Redirect URI**: In the Entra Portal, the App Registration must have `https://video.juliesproperties.co.za` whitelisted as a **Single-Page Application** redirect endpoint.
* **Configuration**: Ensure the `clientId` and `authority` values inside `index.html` align with your Azure tenant configurations.

---

## 🔗 Key Endpoints
* **Production Portal**: [https://video.juliesproperties.co.za](https://video.juliesproperties.co.za)
* **API Gateway**: `https://julies-yt-uploader.oostenjac.workers.dev`