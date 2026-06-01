# Project Contribution & Technical Handover Report
## Mutual Accountability Web Platform

This report acts as a technical summary and contribution breakdown for the Mutual Accountability Web Platform. It details what our team built, how we collaborated to solve tricky bugs, and who contributed what.

---

## 1. Executive Summary

Our main goal was to build a web application that drives performance consistency through peer-to-peer accountability. The app allows users to create goal cycles with set cadences (daily, weekly, etc.) and break them down into actionable milestones. 

To make it work, we created a **Dual-Binding Covenant System**: once you set up a goal, you link it with an accountability partner. Your partner must verify your daily check-in proofs for your streak to continue. We built this with a Node/Express backend, a MongoDB database, and a React frontend utilizing Socket.io for live updates, Zustand for state sync, and Tailwind CSS for the UI.

---

## 2. Meet the Team & Contributions

We split the work logically based on backend services, state synchronization, and user interface design. Here is a breakdown of what each of us focused on:

### 👤 Anthony
Anthony took the lead on UI polish, mobile responsiveness, system integration, and real-time synchronization.
*   **Premium Create Page UI**: Overhauled the [NewGoalPage.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/pages/NewGoalPage.jsx) from a basic form into a premium roadmap builder. Added entrance animations, customized dropdown arrows, and styled a timeline connector track linking sequential milestones.
*   **Timezone-Safe Validation**: Refactored the server check-in system to run timezone-aware validations on MongoDB records over a rolling 36-hour window, preventing users from submitting duplicate check-ins on the same calendar day.
*   **Real-time Synchronization**: Configured Socket.io events (`checkin_approved`) to trigger concurrent updates of goals and user streaks on the client, ensuring metrics update on the screen the second a partner clicks verify.
*   **Mobile Adaptations**: Fixed hardcoded header elements and dropdown widths so that the UI snaps dynamically on smaller screens, and set input text fields to `text-base` to prevent iOS browsers from triggering page zooms.

### 👤 Nabila
Nabila owned the check-in validation engine, model synchronization, and database consistency.
*   **Check-in Validation Engine**: Programmed the core check-in validation rules and anti-spam locks to ensure progress matches established milestone structures.
*   **Milestone Sync Triggers**: Built the mechanics that link check-in approvals directly to milestone completion states.
*   **Casing & Schema Fixes**: Resolved casing mismatches in Mongoose models (such as `CheckIn` vs `Checkin` file structures) and kept the schema integration test suites passing.

### 👤 Fawaz
Fawaz built the early CRUD pathways, matching mechanics, and streak math.
*   **Core CRUD & matching**: Developed the initial endpoints for goal creation, retrieval, and updates, as well as the initial one-to-one partner matching router.
*   **Streak Calculator**: Architected the initial server-side streak engine, which calculates daily consistency streaks.
*   **Multi-Partner Scale**: Refactored the partnership controllers to remove the single-partner limitation, allowing users to participate in multiple pacts simultaneously.

### 👤 Mufeeda
Mufeeda was responsible for setting up the client-side store systems, global API interceptors, and user settings sync.
*   **Dynamic State Sync**: Implemented the Day 3 client state sync structures and global Axios interceptors to handle auth tokens and request headers cleanly.
*   **Zustand Store Refactoring**: Restructured the partnership stores on Day 4 to handle multi-partner feeds and integrated settings preferences.
*   **Auth and Settings Interactivity**: Hooked up timezone, category selections, and bio options, linking them directly to backend profile updates.

---

## 3. The Collaboration Story (How it came together)

The project moved in rapid, iterative milestones:
1.  **Day 1 & 2 (Foundation)**: Fawaz laid down the API routes, while Mufeeda set up the React folders, Axios handlers, and store foundations.
2.  **Day 3 (Validation & Sync)**: Nabila integrated anti-spam rules and cleaned up model naming conflicts. Anthony worked on connecting active partners to dynamic feeds.
3.  **Day 4 (Scale & UI)**: Fawaz expanded the partnership model to allow multiple pacts. Mufeeda synced user profile options. Anthony built the responsive dashboard layout and leaderboards.
4.  **Day 5 (Aesthetics, Responsive & Verification)**: Anthony overhauled the goal creation page, fixed mobile navigation overflows, resolved delayed streak counters using websocket events, and patched server duplicate checks.

---

## 4. Key Challenges & How We Solved Them

### 🐛 The Router Wild-card Redirect Bug
*   **Problem**: In [App.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/App.jsx), clicking the "New Goal" button kept redirecting users back to the landing page `/` instead of loading the form page `/goals/new`.
*   **Cause**: The routing was structured with exact path matches inside a `ProtectedRoute`. React Router v6 was matching `/goals` and failing to resolve the child `/new` path, causing it to fall back to the wildcard redirect.
*   **Solution**: We refactored [App.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/App.jsx) to group `/goals` routes as a nested structure, and updated the header parser in [DashboardLayout.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/components/DashboardLayout.jsx) to properly identify nested sub-paths.

### 🐛 Mobile Dropdown Viewport Cutoff
*   **Problem**: Clicking the notification bell on mobile screens cut off the dropdown menu, rendering only half of the card.
*   **Cause**: The notification card in [Header.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/components/Dashboard/Header.jsx) was using hardcoded tailwind margins (`absolute right-0 w-80`).
*   **Solution**: We refactored [Header.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/components/Dashboard/Header.jsx) to use a responsive snapping container (`fixed left-4 right-4 md:absolute md:w-80 md:right-0`), ensuring it centers on mobile viewports while remaining absolute on desktop.

### 🐛 Delayed Streak Counters (Socket Sync)
*   **Problem**: Users reported that after logging progress and getting immediate verification from their partner, their streak counter did not increment in their browser until they manually refreshed the page.
*   **Cause**: While the server database was successfully updating the user's streak in MongoDB, the Socket.io listener on the client only triggered a feed reload (`fetchFeed()`) and did not fetch the updated user profile or goals.
*   **Solution**: We updated the socket listener in [DashboardLayout.jsx](file:///Users/l/Desktop/Accountability-Web-Platform/client/src/components/DashboardLayout.jsx) to trigger `fetchGoals()` and `checkAuth()` immediately upon receiving a `checkin_approved` signal, instantly updating the UI streak metric.

### 🐛 Duplicate Check-in Gaps (Pending Status)
*   **Problem**: The application allowed users to submit duplicate pending check-ins for the same goal on the same day, which would subsequently cause database constraint errors or confusing errors on partner approval.
*   **Cause**: The validation in [checkinController.js](file:///Users/l/Desktop/Accountability-Web-Platform/server/controllers/checkinController.js) only checked `goal.lastCheckinAt`. Since this value is only updated *after* a partner approves the check-in, a user could submit multiple pending check-ins on the same day.
*   **Solution**: We refactored the validation block in [checkinController.js](file:///Users/l/Desktop/Accountability-Web-Platform/server/controllers/checkinController.js) to query the `CheckIn` collection directly for any submissions made by the user for that goal today (whether pending or approved), returning a friendly notice: `"You have already submitted a check-in for this goal today! 🤝"`.

---

## 5. Technical Stack Status

At handover, the application is fully functional and builds cleanly:

*   **Vite Production Build**: Compiles in `610ms` with zero errors, outputting optimized chunks:
    *   `dist/index.html` (HTML structure)
    *   `dist/assets/index-DW7YwVVz.css` (Tailwind styles)
    *   `dist/assets/index-BHSNoki_.js` (React, Zustand, and Socket client runtime)
*   **Services**: Development servers for both client and server are running, ensuring API routes are fully connected.
*   **Zustand Store Mapping**:
    *   `useAuthStore` manages user credentials, streak counts, and profile configurations.
    *   `useGoalStore` handles goals creation, milestone toggles, and check-in history.
    *   `usePartnershipStore` coordinates sharedCategory scores, invite flows, nudges, and feed pulses.
