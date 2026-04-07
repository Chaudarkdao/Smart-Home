# Smart Home Frontend - Voice & Face Recognition UI

This frontend project is a React application with mock voice enrollment, voice recognition, and face recognition interfaces.

## Features
- **Voice Recognition**: Voice registration UI with username input, MediaRecorder audio capture using microphone
- **Face Recognition**: Webcam capture and face detection with mock API
- **Theme Support**: Light and dark mode toggle with localStorage persistence
- **Responsive Design**: TailwindCSS layout that works on all screen sizes
- **Mock APIs**: Simulated backend for saving and recognizing voice/face samples
- **Loading States**: Error handling and result cards for both recognition types

## Setup
1. Open a terminal in `Frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open the app in your browser at `http://localhost:3000`.

## Usage
- Use the navigation buttons to switch between Voice Recognition and Face Recognition
- Click the theme toggle button (☀️ Light / 🌙 Dark) to switch between light and dark modes
- Voice Recognition: Record audio, save voice samples, and view recognition results
- Face Recognition: Capture webcam images and detect faces with confidence scores

## Notes
- The mock APIs use browser `localStorage` to store saved voice/face registrations.
- Voice recognition responses are simulated after each recording.
- Face detection uses a mock API that returns simulated results.
- Theme preference is saved in localStorage and persists across sessions.
- If the browser blocks microphone/camera access, grant permission and refresh the page.
