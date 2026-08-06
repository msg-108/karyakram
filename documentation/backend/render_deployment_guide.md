# Beginner-Friendly Render.com Deployment Guide for Karyakram Backend

This guide provides a step-by-step, click-by-click walkthrough for hosting the Karyakram Django backend (API + PostgreSQL Database + Redis + Celery Worker) on [Render.com](https://render.com/).

---

## Prerequisites (Before You Begin)

1. A **GitHub account** with your `karyakram` code pushed to GitHub.
2. A free **Render.com account** (Sign up using your GitHub account at [https://dashboard.render.com/register](https://dashboard.render.com/register)).

---

## Step 1: Push Your Code to GitHub

Open your terminal or command prompt in your project folder and run these 3 commands:

```bash
git add .
git commit -m "Deploy: Prepare for Render deployment"
git push origin develop
```

*(Note: Replace `develop` with `main` if your primary GitHub branch is named `main`.)*

---

## Step 2: Open Render Blueprints

1. Log into your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click the blue **`New +`** button at the top right of the screen.
3. Select **`Blueprint`** from the drop-down menu.

---

## Step 3: Connect Your GitHub Repository

1. Under "Connect a repository", search for `karyakram`.
2. Click the **`Connect`** button next to your repository.
3. Give your Blueprint a service group name (e.g., `karyakram-backend-group`).
4. Select your branch (`develop` or `main`).

Render will automatically read the `render.yaml` file in your repository and display the 4 services it will set up for you:
- **`karyakram-backend`**: Django Web API
- **`karyakram-celery-worker`**: Celery Background Task Worker
- **`karyakram-db`**: PostgreSQL Database
- **`karyakram-redis`**: Redis Cache & Task Broker

---

## Step 4: Add Environment Variables

Before clicking Deploy, navigate to the environment variable section for `karyakram-backend` and `karyakram-celery-worker`. Add the following environment variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `ALLOWED_HOSTS` | `karyakram-backend.onrender.com` | Your backend URL domain on Render |
| `SECRET_KEY` | `django-insecure-prod-secret-key-1234567890-abcdef` | Secret key for Django security |
| `QR_JWT_SECRET_KEY` | `qr-jwt-dedicated-secret-key-32bytes-min` | Secret key for signing QR code tickets |
| `FIELD_ENCRYPTION_KEY` | `43qciR9mYlP-CP4yYe91VcBZFtxbruUHn3VBT4dVymM=` | Key for encrypting sensitive fields |
| `SITE_URL` | `https://karyakram.vercel.app` | URL of your frontend website |

> 💡 **How to generate keys easily in your terminal:**
> Run `python -c "import secrets; print(secrets.token_urlsafe(32))"` to generate random secret keys for `SECRET_KEY` and `QR_JWT_SECRET_KEY`.

---

## Step 5: Click "Apply" & Wait for Deployment

1. Click the blue **`Apply`** button at the bottom of the page.
2. Render will begin building your databases and services automatically.
3. Wait about 3 to 5 minutes until all service statuses show **`Live`** green checkmarks.

---

## Step 6: Create Your Admin Account (For Demo)

Once the deployment completes:

1. Click on **`karyakram-backend`** (Web Service) in your Render Dashboard.
2. Click on the **`Shell`** tab on the left sidebar.
3. Type the following command and press **Enter**:
   ```bash
   python manage.py createsuperuser
   ```
4. Follow the prompt to enter your admin **Username**, **Email**, and **Password**.

---

## Step 7: Verify Your Live Backend API

Open your browser and visit:
`https://karyakram-backend.onrender.com/api/docs/` *(Replace with your actual Render URL)*.

If you see the interactive **Swagger UI API Documentation** page, **CONGRATULATIONS! Your backend is 100% deployed and live!** 🎉

---

## Common Questions & Troubleshooting

### Q: Where do I find my live backend URL?
On your Render Dashboard, click `karyakram-backend`. The live URL is shown directly under the service name at the top left (e.g., `https://karyakram-backend.onrender.com`).

### Q: How do I connect my frontend to this backend?
In your React/Vite frontend environment settings (`.env.production`), set:
```env
VITE_API_BASE_URL=https://karyakram-backend.onrender.com/api
```

### Q: Why does the first HTTP request take 30–50 seconds after inactivity?
Render's free web services enter a "sleep" state after 15 minutes of inactivity. The first request wakes the server up, which takes about 30–50 seconds. Subsequent requests will respond instantly!
