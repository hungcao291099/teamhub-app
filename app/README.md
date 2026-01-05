# TeamHub Mobile App

This is the React Native mobile application for TeamHub, built with Expo.

## Prerequisites

- Node.js and npm installed.
- **Expo Go** app installed on your mobile device (iOS or Android).
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

## Getting Started

1.  **Navigate to the app directory:**
    ```bash
    cd app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npx expo start
    ```

## Debugging on Device

1.  **Ensure Same Network:** Make sure your mobile device and your computer are connected to the **same Wi-Fi network**.
2.  **Start the App:**
    - Run `npx expo start`.
    - You will see a QR code in the terminal.
3.  **Scan QR Code:**
    - **Android:** Open the Expo Go app and tap "Scan QR Code". Scan the code from your terminal.
    - **iOS:** Open the default Camera app and scan the QR code. Tap the notification to open it in Expo Go.
4.  **Reloading:**
    - Shake your device to open the developer menu.
    - Tap "Reload" to refresh the app code.

## Configuration

The API base URL is configured in `src/config/constants.ts`.
Current default: `http://172.16.10.65:3001`

**Important:** Ensure your computer's firewall is not blocking incoming connections on port 8081 (Expo) or 3001 (Backend API).

## Troubleshooting

-   **Network Error / Connection Refused:**
    -   Check if the IP address `172.16.10.65` is correct for your computer.
    -   Try turning off the firewall temporarily.
    -   Ensure your phone can ping your computer.
-   **Metro Bundler stuck:**
    -   Press `Ctrl + C` to stop the server.
    -   Run `npx expo start -c` to start with a clear cache.
