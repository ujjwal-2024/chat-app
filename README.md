# 💬 ChatApp

A modern real-time full-stack chat application built with **React**, **Firebase**, and **Cloudinary**. ChatApp provides a seamless messaging experience with real-time communication, media sharing, AI-powered utilities, and a beautiful glassmorphism interface.

---
## 🎯 Highlights

- Real-time chat application built with React and Firebase
- Supports image sharing, message reactions, and disappearing messages
- AI-powered smart replies and message translation
- Responsive glassmorphism UI with dark/light mode
- Deployed on Vercel

---

## 🚀 Live Demo

**Live Application:** https://chat-app-sigma-ten-65.vercel.app/

**Github Repository:** https://github.com/ujjwal-2024/chat-app

---


## ✨ Features

### 💬 Real-Time Messaging

* Real-time chat using Firebase Firestore
* Send and receive text messages instantly
* Image sharing with Cloudinary integration
* Reply to specific messages
* Edit previously sent messages
* Delete messages
* Message reactions (👍 ❤️ 😂 😮 😢 😡)
* Typing indicators
* Online/Offline status tracking

### ⏳ Disappearing Messages

* Auto-delete messages after:

  * 5 minutes
  * 1 hour
  * 24 hours

### 🖼️ Media Features

* Image preview before sending
* Fullscreen image viewer
* Secure cloud image storage

### 👥 User Management

* User registration and login
* Profile customization
* Avatar upload
* Bio editing
* Search users by username or display name
* Discover registered users
* Chat request system
* Block and unblock users

### 🔔 Notifications

* Sound notifications for incoming messages
* Mute specific conversations
* Notification preference management

### 🤖 AI Features

* Smart reply suggestions
* Message translation support
* Multiple language support

### 🎨 User Experience

* Glassmorphism UI
* Purple/Violet theme
* Dark mode and Light mode
* Responsive design
* Smooth animations
* Mobile-first experience

### 🔒 Account Management

* Email & Password Authentication
* Forgot Password functionality
* Profile editing
* Account deactivation
* Permanent account deletion

---

## 🌍 Supported Languages

* Hindi
* English
* Spanish
* French
* Arabic
* Japanese
* German
* Chinese
* Portuguese
* Russian
* Italian

---

## 🏗️ System Architecture

Frontend (React + Vite)
↓
Firebase Authentication
↓
Firebase Firestore
↓
Cloudinary Storage
↓
MyMemory Translation API

---

## 🛠️ Tech Stack

| Technology         | Purpose             |
| ------------------ | ------------------- |
| React              | Frontend UI         |
| Vite               | Build Tool          |
| Firebase Auth      | Authentication      |
| Firebase Firestore | Real-time Database  |
| Cloudinary         | Image Storage       |
| MyMemory API       | Translation Service |
| React Router       | Routing             |
| React Toastify     | Notifications       |
| Web Audio API      | Sound Alerts        |

---

## 📂 Project Structure

src/
├── assets/
├── components/
│ ├── ChatBox/
│ ├── LeftSidebar/
│ └── RightSidebar/
├── config/
│ └── firebase.js
├── context/
│ └── AppContext.jsx
├── lib/
│ ├── upload.js
│ └── ai.js
├── pages/
│ ├── Chat/
│ ├── Login/
│ └── ProfileUpdate/
└── main.jsx

---

## 📱 Responsive Design

| Device  | Layout                   |
| ------- | ------------------------ |
| Desktop | Sidebar + Chat + Profile |
| Tablet  | Sidebar + Chat           |
| Mobile  | Single Panel Navigation  |

---

## 📈 Performance Optimizations

* Real-time Firestore listeners
* Optimized React rendering
* Lazy-loaded assets
* Responsive image handling
* Efficient state management
* Fast Vite builds

---

## 🔮 Future Enhancements

* Group Chats
* Voice Messages
* Video Calling
* Push Notifications
* End-to-End Encryption
* AI Chat Assistant
* Read Receipts
* Message Scheduling

---

## 🙏 Acknowledgements

* Firebase
* Cloudinary
* React Community

---

## 📄 License

Licensed under the MIT License.

Feel free to fork, modify, and use this project for personal or commercial purposes.
