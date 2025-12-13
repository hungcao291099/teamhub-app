
# CI/CD Setup Guide (GitHub Actions)

This guide helps you set up automatic deployment using a dedicated user on your Ubuntu server.

## 1. Create a Dedicated User (On Server)
It is best practice to use a separate user for deployment (e.g., `github-deploy`) instead of your personal account.

Log into your server and run:

```bash
# 1. Create new user 'github-deploy'
sudo adduser github-deploy

# 2. Add user to 'docker' group (to run docker without sudo)
sudo usermod -aG docker github-deploy

# 3. Switch to the new user
su - github-deploy
```

## 2. Generate SSH Keys
You need an SSH key pair. The **Private Key** goes to GitHub, and the **Public Key** stays on the server.

```bash
# Generate key pair (Press Enter for all prompts, NO PASSWORD)
ssh-keygen -t ed25519 -C "github-actions"

# Add public key to authorized_keys
mkdir -p ~/.ssh
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Display the PRIVATE key (You will copy this to GitHub)
cat ~/.ssh/id_ed25519
```
**COPY** the entire content of the private key (starting with `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END...`).

## 3. Configure GitHub Secrets
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

| Name | Value |
|------|-------|
| `SERVER_HOST` | Your server IP address (e.g., `123.45.67.89`) |
| `SERVER_USER` | `github-deploy` |
| `SSH_PRIVATE_KEY` | Paste the Private Key you copied in Step 2 |

## 4. Initial Setup for the Deploy User
The deploy user needs the repository cloned first.

On your server (still as `github-deploy` user):
```bash
# Go to home directory
cd ~

# Clone the repo (Use HTTPS if you don't want to setup Git keys, or setup deploy keys)
# For public repo:
git clone https://github.com/hungcao291099/teamhub-app.git teamhub-app

# For private repo, the easiest way for CI/CD is using Personal Access Token (PAT)
# git clone https://<YOUR_PAT>@github.com/hungcao291099/teamhub-app.git teamhub-app

# Enter the directory
cd teamhub-app

# CREATE the database file (Critical step!)
# Since this is a new user, create the file again or copy from old location.
# Creating new empty:
touch server/database.sqlite
```

## 5. Test
Push a commit to the `main` branch on GitHub.
- Go to the **Actions** tab in your repo.
- You should see "Deploy to Production" running.
- If successful, your server is updated!

## Troubleshooting `Permission denied`
If the workflow fails with permission errors, ensure:
1. `github-deploy` is in the docker group: `groups github-deploy` should show `docker`.
2. `server/database.sqlite` and `server/public/uploads` are writable by `github-deploy`.
   ```bash
   # Fix permissions
   sudo chown -R github-deploy:github-deploy ~/teamhub-app
   ```
