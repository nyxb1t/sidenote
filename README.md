# Sidenote — AI Study Partner

A React Native (Expo) mobile app. Dark-themed, personal AI study companion with notebook-style chat, notes, and progress tracking.

## Stack

- **Expo SDK 51**
- **React Navigation v6** — Bottom Tab + Native Stack
- **@expo/vector-icons** — Ionicons
- **react-native-safe-area-context**

## Screens

| Screen | Scroll | Description |
|---|---|---|
| Splash | — | Animated logo entrance + CTA |
| Onboarding | — | 3-slide FlatList with dot indicators |
| Home | ❌ | Fixed layout — greeting, continue learning, quick actions |
| Chat | ✅ | Notebook-style messages, action buttons, fixed input bar |
| Notes | ✅ | Search + subject filters + note cards |
| Profile | ✅ | Stats, plan info, learning insights, usage |

## Theme

| Token | Value | Use |
|---|---|---|
| `bg` | `#1C1C1E` | Main background |
| `surface` | `#252527` | Cards & inputs |
| `yellow` | `#E8D44D` | Primary accent |
| `coral` | `#E87D6A` | Secondary accent (minimal) |
| `textPrimary` | `#F0EDE4` | Main text |

## Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (iOS or Android).

## Folder Structure

```
sidenote/
├── App.js                          # Root — phase manager (splash→onboarding→app)
├── src/
│   ├── theme/colors.js             # Centralised color tokens
│   ├── data/mockData.js            # All static mock data
│   ├── navigation/
│   │   └── BottomTabNavigator.js   # Bottom tabs
│   ├── screens/
│   │   ├── SplashScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ChatScreen.js
│   │   ├── NotesScreen.js
│   │   └── ProfileScreen.js
│   └── components/
│       ├── ProgressBar.js
│       ├── QuickActionButton.js
│       ├── NoteCard.js
│       ├── ChatMessage.js
│       └── StatCard.js
```
