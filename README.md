# Zorphix App

A React Native Expo application for event management.

## Prerequisites

- Node.js (LTS recommended)
- Expo Go app on your mobile device (iOS/Android)

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the application:**
    ```bash
    npx expo start
    ```

3.  **Run on Device:**
    - Scan the QR code shown in the terminal using the Expo Go app (Android) or Camera app (iOS).

## Troubleshooting

### iOS Connection Issues
If you cannot connect via the QR code on iOS:
1.  **Stop the current server** (Ctrl+C).
2.  **Restart with Tunnel** (bypasses network restrictions):
    ```bash
    npx expo start --tunnel
    ```
    *Note: If you encounter permission errors installing `@expo/ngrok` globally, run `npm install --save-dev @expo/ngrok` first.*
    *Note: If you encounter permission errors installing `@expo/ngrok` globally, run `npm install --save-dev @expo/ngrok` first.*

### Tunnel Timeout / Network Issues
If you see "ngrok tunnel took too long to connect":
1.  **Retry**: Sometimes the connection is just slow. Run the command again.
2.  **Check Internet**: Ensure you have a stable internet connection.
3.  **Use Local Connection (Same Wi-Fi)**:
    - Ensure your computer and phone are on the **exact same Wi-Fi network**.
    - Run `npx expo start --host lan`.
    - If QR scanning fails, look for the URL (e.g., `exp://192.168.x.x:8081`) in the terminal.
    - **Manually Enter URL**: On iOS, you can't manually enter inside Expo Go easily, but you can paste `exp://...` into Safari, which will prompt to open Expo Go.

### Manual Entry (iOS)
If the camera doesn't work:
1.  Copy the URL from the terminal (e.g., `exp://192.168...`).
2.  Email/text it to yourself or type it into **Safari** on your iPhone.
3.  Safari will ask to open in "Expo Go".


## Project Structure

- `App.tsx`: Main entry point with Navigation setup.
- `navigation/`: Navigation configuration and type definitions.
- `screens/`: UI screens (Login, Home, Event Detail).

## Features (Template)

- **Login Screen**: UI only, navigates to Home.
- **Home Screen**: Lists dummy events with categories.
- **Event Detail**: Shows event info, "Scan QR" and "Register" buttons.
