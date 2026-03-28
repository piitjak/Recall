# Recall - Software Documentation

## 1. Software Requirements Specification (SRS)

### 1.1 Functional Requirements
*   **Card Creation**: Users can create new flashcards with a text body and an optional "Cluster" (category).
*   **Spaced Repetition System (SRS)**: The app must automatically schedule card reviews based on user performance using a modified SM-2 algorithm.
*   **Review Sessions**:
    *   **Cluster Review**: Users can review cards belonging to a specific cluster.
    *   **Random 5**: A smart session that pulls 5 cards from across all clusters, prioritizing those currently due.
*   **Interactive Review UI**: A swipe-based interface where swiping right indicates "Got it" (successful recall) and swiping left indicates "Forgot" (failed recall).
*   **Cluster Management**:
    *   Automatic grouping of cards into clusters.
    *   Toggleable view modes: **Grid View** (detailed) and **List View** (minimalist/expandable).
*   **Progress Tracking**:
    *   **Activity Heatmap**: A GitHub-style grid visualizing review frequency over the last 28 days.
    *   **Due Indicators**: Visual cues showing how many cards are ready for review in each cluster.
*   **Theme Support**: Full support for Light and OLED Dark modes, with persistence across sessions.
*   **Data Persistence**: All user data (cards, history, settings) must be persisted locally in the browser.

### 1.2 Non-Functional Requirements
*   **Performance**: Animations (swipes, transitions) must be fluid (60fps) using hardware acceleration.
*   **Usability**: Mobile-first design with large touch targets (min 44px) and high-contrast typography.
*   **Offline Capability**: The app must be fully functional without an internet connection (Offline-first).
*   **Readability**: High-contrast color palettes and "Black" font weights for maximum legibility.


---

## 2. Software Architecture Document (SAD)

### 2.1 Technology Stack
*   **Framework**: React 18+ with Vite.
*   **Language**: TypeScript (Strict Mode).
*   **Styling**: Tailwind CSS (Utility-first).
*   **Animations**: Framer Motion (Motion for React).
*   **Icons**: Lucide React.
*   **Storage**: Browser `localStorage` API.

### 2.2 Data Architecture
#### 2.2.1 Card Model
```typescript
interface Card {
  id: string;
  content: string;
  cluster: string;
  createdAt: number;
  lastReviewed?: number;
  nextReview: number; // Timestamp for scheduling
  interval: number;   // Current gap in days
  ease: number;       // Multiplier for interval growth
}
```

#### 2.2.2 Review History
Stored as a key-value map: `Record<string, number>` where the key is an ISO date string (`YYYY-MM-DD`) and the value is the count of reviews performed.

### 2.3 Component Architecture
*   **App.tsx**: The Root Orchestrator. Manages global state (cards, history, theme) and routing between `Home` and `Review` modes.
*   **SwipeableCard**: A specialized component using Framer Motion's `drag` gestures to handle the core review interaction.
*   **Cluster Components**:
    *   **DetailedGrid**: High-information cards for cluster selection.
    *   **SimpleList**: Minimalist accordion-style list for cluster selection.
*   **ActivityHeatmap**: A data-driven visualization component for progress tracking.
*   **AddCardModal**: An animated overlay for data entry with custom dropdown logic.

### 2.4 Spaced Repetition Logic (Algorithm)
The app utilizes a modified **SM-2 Algorithm**:
1.  **Initial State**: New cards start with an `interval` of 1 and an `ease` of 2.5.
2.  **Successful Recall (Swipe Right)**:
    *   `newInterval = Math.ceil(currentInterval * currentEase)`
    *   `newEase = Math.min(3.5, currentEase + 0.1)`
3.  **Failed Recall (Swipe Left)**:
    *   `newInterval = 1` (Reset to immediate review)
    *   `newEase = Math.max(1.3, currentEase - 0.2)`
4.  **Scheduling**: `nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000)`

### 2.5 UI/UX Design Principles
*   **OLED Optimization**: Pure black (`#000000`) backgrounds in dark mode for battery efficiency.
*   **Tactile Feedback**: Scale-based animations (`whileTap`) on all interactive buttons.
*   **Glassmorphism**: Backdrop blurs on headers and navbars for depth.
*   **Readability-First**: Use of `font-black` and `tracking-tighter` for strong visual hierarchy.
