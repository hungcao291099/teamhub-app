
# Deployment Instructions for Ubuntu Server

Follow these steps to deploy the TeamHub application on a fresh Ubuntu server.

## Prerequisites

1.  **Update System**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Install Docker & Docker Compose**:
    ```bash
    sudo apt install docker.io docker-compose -y
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    # You may need to logout and login again for group changes to take effect
    ```

## Deployment Steps

1.  **Transfer Files**:
    Copy the entire project directory to your server (e.g., using `git clone` or `scp`).
    ```bash
    # Example using Git
    git clone <your-repo-url> teamhub-app
    cd teamhub-app
    ```

2.  **Prepare Database File**:
    **CRITICAL**: You must ensure `server/database.sqlite` exists as a file before starting Docker. If it doesn't exist or is missing, Docker might create it as a directory, causing immediate crash.
    ```bash
    # Create empty file if it doesn't exist
    touch server/database.sqlite
    ```

3.  **Start Services**:
    Run Docker Compose to build and start the containers.
    ```bash
    docker-compose up -d --build
    ```

4.  **Verify Deployment**:
    -   Check status: `docker-compose ps`
    -   View logs: `docker-compose logs -f`
    -   Access the app: Open your browser and go to `http://<your-server-ip>`.

## Troubleshooting

-   **Database Error**: If you see "EISDIR: illegal operation on a directory, open '.../database.sqlite'", it means Docker created a directory instead of a file.
    -   Fix:
        ```bash
        docker-compose down
        sudo rm -rf server/database.sqlite
        touch server/database.sqlite
        docker-compose up -d
        ```
-   **Permission Issues**: Ensure the user running docker has permissions to write to `server/public/uploads` and `server/database.sqlite`.
-   **DNS/Network Issues**: If you see `Temporary failure resolving 'archive.ubuntu.com'`, your server cannot resolve domain names.
    -   **Quick Fix**:
        ```bash
        # Add Google DNS temporarily
        echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
        
        # Now try updating again
        sudo apt update
        ```


## Directory Structure on Server
Ensure your server directory looks like this:
```
teamhub-app/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
└── server/
    ├── Dockerfile
    ├── package.json
    ├── database.sqlite (File!)
    └── ...
```
