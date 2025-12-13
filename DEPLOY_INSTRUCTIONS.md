
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
    **CRITICAL ERROR FIX**: If you see `KeyError: 'ContainerConfig'` or similar python errors, it means you are using the old Legacy `docker-compose` (v1) which is incompatible with modern Docker.
    
    **Solution:** Use the new Docker Compose V2 command (space instead of hyphen):
    ```bash
    # Check if you have v2
    docker compose version
    
    # Run with V2
    docker compose up -d --build
    ```
    
    If `docker compose` command is not found:
    ```bash
    sudo apt install docker-compose-plugin
    docker compose up -d --build
    ```

-   **Permission Issues (Docker)**: If you see `Permission denied`.
    -   **Fix**: `sudo docker compose up -d --build` OR `newgrp docker` first.

-   **Container Conflict**: If you see `Conflict. The container name ... is already in use`.
    -   **Fix**: Remove the old stuck containers:
        ```bash
        sudo docker rm -f $(sudo docker ps -aq)
        ```
        Then try up again.

    
-   **Permission Issues (Files)**: Ensure the user running docker has permissions to write to `server/public/uploads` and `server/database.sqlite`.
-   **DNS/Network Issues**: If you see `Temporary failure resolving 'archive.ubuntu.com'`, your server cannot resolve domain names.
    -   **Quick Fix (Temporary)**:
        ```bash
        # Force overwrite resolv.conf
        sudo rm /etc/resolv.conf
        echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
        
        # Now try updating again
        sudo apt update
        ```
    -   **Robust Fix (Netplan)**:
        If the above doesn't work, configure Netplan.
        1.  Check your interface name: `ip a` (e.g., `eth0` or `ens3`).
        2.  Edit netplan config (file name varies):
            ```bash
            sudo nano /etc/netplan/00-installer-config.yaml
            # OR
            sudo nano /etc/netplan/50-cloud-init.yaml
            ```
        3.  Add `nameservers` under your interface:
            ```yaml
            network:
              ethernets:
                eth0: # Replace with your interface name
                  nameservers:
                    addresses: [8.8.8.8, 8.8.4.4]
              version: 2
            ```
        4.  Apply changes:
            ```bash
            sudo netplan apply
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
