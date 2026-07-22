# Scholars Syndicate — Master Review, Innovation Gap Analysis & Implementation Roadmap
*Cross-reference: UI/UX Audit (scholars-syndicate-ui-review.md) + Innovation Vision (my_app_innovation.docx)*
*Codebase: cbt-frontend | June 2026*

---

## Part 1 — UI/UX Audit Fixes (Already Applied in This Build)

### ✅ FIX 1 — YouTube Subscription Gate
**Status: IMPLEMENTED** — `src/components/YouTubeGate.js` (new file)

The gate now launches fullscreen before the BrowserRouter renders.
Stores `elitronix_subscribed = "true"` in localStorage on confirm.
`src/App.js` checks this flag on mount — if not set, renders YouTubeGate and nothing else.

**What was changed:**
- `App.js` — imported YouTubeGate, added `gateCleared` state, gate renders before all routes
- `YouTubeGate.js` — new component with animated UI, pulse ring, particle burst on confirm, channel link

---

### ✅ FIX 2 — Text Contrast (WCAG AA Compliance)
**Status: IMPLEMENTED** — `src/context/ThemeContext.js`

| Token | Before | After | Contrast ratio |
|---|---|---|---|
| `textMuted` (both modes) | `#8B99C7` | `#A8B8D8` | ~3.8:1 → **~4.6:1** ✓ |
| `surfaceAlt` (both modes) | `#151929` | `#1C2236` | Card depth improved |
| `textSub` dark mode | `#CBD5E1` | `#C8D3F5` | Unified with light mode |
| `surface` dark mode | `#111827` | `#151929` | Aligned, less harsh step |
| `font-label` minimum | 12px | **14px** | Prevents unreadable small text |

---

### ✅ FIX 5 — Input Placeholder Visibility
**Status: IMPLEMENTED** — `Login.js`, `Register.js`, `ForgotPassword.js`

All instances of `rgba(255,255,255,0.22)` replaced with `rgba(255,255,255,0.50)`.
Typed input text colour should additionally be set to `color: #F1F5F9` on all `<input>` elements
in these files (manual check recommended on Android devices).

---

### ✅ FIX 6 & 7 — Skeleton Loaders + Error States
**Status: IMPLEMENTED (GemStore)** — `src/pages/GemStore.js`

GemStore now shows an animated shimmer skeleton during load and a friendly
"Couldn't load Gem Store / Tap to Retry" error screen instead of a blank view.

**Still needs the same treatment (copy the pattern from GemStore):**
- `Spirits.js`
- `Flashcards.js`
- `SchoolFinder.js`
- `Seasons.js`
- `KnowledgeVault.js`

---

### ✅ FIX 8 — Premium/Upgrade Flow
**Status: IMPLEMENTED** — `src/pages/Subscribe.js` (new file) + `App.js` route update

- `/upgrade` now redirects to `/subscribe` (not `/tokens`)
- `/subscribe` is a full-featured page with: free vs premium comparison, 5 plan cards with perks, WhatsApp CTA, testimonials, and a link back to `/gems` for token top-ups
- `/tokens` is preserved exactly as-is for gem purchases — these are now clearly separated products

---

### ✅ FIX 10 — Onboarding for New Users
**Status: IMPLEMENTED** — `src/components/Onboarding.js` (new file)

3-screen mandatory onboarding: (1) Welcome, (2) Pick your exam — JAMB or Post-UTME, (3) First Challenge CTA.
Stores `ss_onboarded = "true"` in localStorage. Stores `ss_exam_pref` for personalisation.

**To wire it in:** import `Onboarding` and `needsOnboarding` from `components/Onboarding.js` in `Register.js`.
After successful registration, redirect to a temporary route that shows the Onboarding component
before landing on the Dashboard.

---

### ⚠️ FIX 3 — Remove Hamburger Sidebar (Pending)
**Status: NOT YET APPLIED — requires careful surgery in Dashboard.js**

Dashboard.js is 758 lines. The sidebar is deeply embedded.

**What to do:**
1. In `Dashboard.js` delete the `SideMenu` / sidebar render and the `sideOpen` state + `setSideOpen` toggle.
2. Add a 5th tab `{ id:"more", icon:"⊞", label:"More" }` to the bottom nav array.
3. Create a `MoreTab` component (inline or extracted) listing all sidebar links as a scrollable grid.
4. Remove the hamburger button from the top bar.

**New 5-tab structure:**
| Tab | Icon | Key features |
|---|---|---|
| Home | 🏠 | Greeting, one CTA, daily mission, streak |
| Study | 📚 | JAMB, Post-UTME, AI Tutor, Flashcards, Error Review |
| Arena | ⚔️ | All battle modes, Leaderboard, Seasons |
| Progress | 📊 | Performance, Heatmap, Predicted Score, Badges |
| More | ⊞ | Profile, Gems, Spirits, Vault, Factions, Referral, Planner, Theme |

---

### ⚠️ FIX 4 — Simplify Dashboard Home Tab (Pending)
**Status: NOT YET APPLIED — design overhaul required**

The current home tab has 20+ tappable elements competing for attention.

**Target layout (apply the Duolingo single-hero rule):**
```
Top bar: App name | Streak | Bell | Avatar (44px touch targets)
──────────────────────────────────────────
Hero card: "Good morning [Name]"
          [  Start Practice →  ]  ← ONE big button, 60% width, primary gradient
──────────────────────────────────────────
Two stat chips (side by side): Avg Score | Today's XP
──────────────────────────────────────────
Daily Mission card: Mission title + progress bar + reward
──────────────────────────────────────────
↓ scroll  "Explore ↓"  divider
Recent exams, arena banner, explore grid (8 cards)
```

Everything currently above the fold either moves to a dedicated tab or slides below the scroll divider.

---

### ⚠️ FIX 9 — Touch Targets Too Small (Pending)
**Status: NOT YET APPLIED**

All icon buttons in Dashboard.js Header are `width:36, height:36`.
Change to `minWidth:44, minHeight:44` with padding adjusting the visual icon.
Apply consistently to: Dashboard header, bottom nav buttons, all close/back buttons.

---

## Part 2 — Innovation Vision Gaps (Features from PDF Not Yet Built or Needs Upgrade)

### 🔴 MISSING — School Wars Arena Mode
**Document reference:** Arena System → School Wars
**Current state:** Arena.js has 1v1, Blitz, Survival, Squad (Clash Squad) — but no inter-school battle mode.

**What's needed:**
- A "School Wars" match type in Arena.js
- Schools need a group/faction ID (factions exist — cross-link them)
- A weekly school ranking on the Leaderboard page
- Each win gives points to the student's school faction, not just the individual

---

### 🔴 MISSING — Scholar Spirits Active Skills in Arena
**Document reference:** Scholar Spirits System → Active Skills
**Current state:** Spirits.js shows passive bonuses and evolution but no active-skill activation during Arena matches.

**What's needed:**
- `Match.js` needs a "Spirit Skill" button that activates the equipped spirit's ability
- Example effects: Void Weaver blurs opponent buttons for 5 seconds; Oracle Owl removes a wrong answer
- Backend endpoint: `POST /arena/activate-skill` with spirit_id + match_id
- Animation system in Match.js for the skill firing (neon sweep, laser scan, web overlay)

---

### 🔴 MISSING — Voice Rooms / Study Rooms (Social)
**Document reference:** Social & Community Features → Voice Rooms, Study Rooms
**Current state:** ClassroomSession.js handles live sessions but no free-form voice room or student social space.

**What's needed:**
- A new `/rooms` route with lobby-style UI
- Real-time presence list (who's online studying)
- Optional: integrate with existing socket infrastructure in `utils/classroomSocket.js`
- Low lift to start: text-based "Study Room" chat grouped by subject/exam type

---

### 🔴 MISSING — Friend Lists & Squad System
**Document reference:** Social & Community Features → Friend Lists, Squad Systems
**Current state:** No friend or social graph exists in the frontend.

**What's needed:**
- `Profile.js` needs "Add Friend" button
- New `/friends` page: pending requests, friends list, friend activity feed
- Squads: 2–4 friends form a squad, squad score shown on leaderboard
- Backend: friend endpoints (send, accept, decline, list)

---

### 🔴 MISSING — Micro-Interactions & Visual Atmosphere
**Document reference:** UI/UX Atmosphere → Micro Interactions + Sound Design
**Current state:** App has some animations (XP float, bar-in, slide-in) but lacks the full atmosphere described.

**Missing elements:**
- **Coins fly into wallet** — when earning coins in Arena or exams, animate coin icons flying to the balance chip
- **Haptic feedback** — on answer submission, badge unlock, mission complete (use `navigator.vibrate()` where supported)
- **Sound effects** — `utils/sounds.js` exists but is it wired to all reward moments? Wire to: exam answer correct/wrong, badge unlock, level up, arena victory, spin win
- **Screen flash on unlocks** — brief radial glow pulse when a new badge or spirit is unlocked
- **Confetti bursts** — on level-up, arena win, mission complete (CSS particle system or canvas-confetti library)

---

### 🔴 MISSING — Dual Currency Economy in Gem Store
**Document reference:** Game Economy System → Gem Pricing Structure
**Current state:** GemStore.js loads packages from API — the backend controls the pricing. BUT the UI calls them "Tokens" not "Gems" (inconsistency with the innovation doc).

**Issue:** The UI uses 🎫 Token icon and says "Token Store" but the innovation doc's branding calls them Gems (💎).

**What to fix:**
- Decide on ONE name — the innovation doc says Gems (💎) for premium currency, Coins (🪙) for free currency
- Update GemStore.js labels: "Token Store" → "Gem Store", 🎫 → 💎
- The dual economy (Coins earned free, Gems purchased) should be visible on the store page — show both balances

---

### 🟡 NEEDS UPGRADE — Scholar Spirits Page
**Document reference:** Scholar Spirits System (detailed)
**Current state:** Spirits.js has rarity, evolution stages, passive skills — strong foundation.

**What's missing vs the vision:**
- **Specific named spirits from doc are not yet in backend data:** Void Weaver (🕷), Oracle Owl (🦉), Ember Wyrm (🐉), Neuro Bot (🤖) — ensure these exist in the backend with their exact passives
- **Active skill animation overlay** — the detail modal shows passive but no active skill trigger UI
- **Evolution naming chain** — the doc specifies e.g. Baby Owl → Oracle Owl → Cosmic Owl → Celestial Owl. The evolution stages should show these names, not just stage numbers
- **Mythic cinematic entry** — Mythic rarity spirits should have a full-screen cinematic animation when first unlocked or viewed (not just a card animation)
- **Skill animation canvas** — when viewing a spirit, tapping the active skill should demonstrate the animation in the modal

---

### 🟡 NEEDS UPGRADE — Spin Wheel
**Document reference:** Spin & Luck System
**Current state:** SpinWheel.js exists.

**What to verify / add:**
- 1 free daily spin — is this enforced?
- Extra spins via watching ads (not implemented — needs ad integration or token spend)
- Event-exclusive rewards — the spin rewards should dynamically change during special events (Seasons.js integration)
- Rare/Legendary drop indicators — visual probability display per segment makes it feel more legitimate and exciting

---

### 🟡 NEEDS UPGRADE — Knowledge Vault
**Document reference:** Knowledge Vault (PDF Marketplace) → PDF Economy
**Current state:** KnowledgeVault.js exists.

**Gap:** The innovation doc specifies a dual/triple currency purchase system:
- Coins (free currency) for lower-tier PDFs
- Gems for mid-tier
- Real money (₦) for elite bundles

Verify the backend and UI support all three purchase paths. If only one exists, expand it.

Also: "AI-generated study materials" are mentioned in the vault vision but not visible in the frontend.
Consider an "AI Generate" button that uses the AI Questions system to create a custom mini-study pack.

---

### 🟡 NEEDS UPGRADE — Badge System
**Document reference:** Badge & Identity System → Secret Badges
**Current state:** Badges.js exists.

**Missing:**
- **Secret / hidden badges** — badges whose existence isn't shown until earned (show a locked silhouette with "???" label)
- **Badge rarity tiers** — Common, Rare, Epic, Legendary badge visual distinction
- **Title system** — the doc mentions "Titles" as part of identity (e.g. "Arena Monster", "Speed Demon"). These should be earnable and displayable on the Profile page

---

### 🟡 NEEDS UPGRADE — AI Systems
**Document reference:** AI Systems → AI Quiz Generator from Videos/PDFs
**Current state:** AITutor.js + AIQuestions.js exist.

**Missing:**
- **AI Quiz Generator from PDF** — upload or select a Knowledge Vault PDF, AI generates questions from it
- **AI Quiz Generator from Video** — user pastes a YouTube link or selects a Video Library item, AI generates questions
- **AI Study Planner** — StudyPlanner.js exists but is it AI-driven or manual? Should auto-generate a schedule based on exam date + weakness heatmap data

---

### 🟡 NEEDS UPGRADE — Seasons
**Document reference:** (implied from Arena + Competitive Systems)
**Current state:** Seasons.js exists.

**What to add:**
- Seasonal cosmetic rewards — each season should award a unique badge, profile frame, or Spirit skin
- Seasons should tie to Spin Wheel event rewards (limited-time drops)
- End-of-season leaderboard snapshot with rewards distributed

---

### 🟢 ALREADY WELL IMPLEMENTED (matches innovation vision)

| Feature | Status |
|---|---|
| Arena 1v1, Blitz, Survival, Squad | ✅ Implemented |
| Scholar Spirits — rarity + evolution + passive | ✅ Strong foundation |
| Spin Wheel | ✅ Exists |
| Knowledge Vault (PDF store) | ✅ Exists |
| Gem Store with WhatsApp purchase | ✅ Exists |
| Skills / Boosts system | ✅ Exists |
| Weakness Heatmap | ✅ Exists |
| Predicted Score | ✅ Exists |
| Daily Challenge | ✅ Exists |
| Missions system | ✅ Exists |
| Referral system | ✅ Exists |
| Factions | ✅ Exists |
| AI Tutor | ✅ Strong |
| Study Planner | ✅ Exists |
| Personality Profile | ✅ Exists |
| School Finder | ✅ Exists |
| Flashcards | ✅ Exists |
| Video Library | ✅ Exists |
| Theme Settings (8 themes) | ✅ Exists |
| Parent Portal | ✅ Exists |
| Error Review | ✅ Exists |
| Beat Yourself | ✅ Exists |
| Admission Checker | ✅ Exists |
| Streak system | ✅ Exists |
| XP + Level system | ✅ Exists |
| Notifications | ✅ Exists |

---

## Part 3 — Priority Implementation Schedule (Updated)

### Week 1 (Critical / Already in this build)
- ✅ YouTube subscription gate — **DONE**
- ✅ Text contrast fixes in ThemeContext — **DONE**
- ✅ Placeholder contrast in Login / Register / ForgotPassword — **DONE**
- ✅ /subscribe dedicated Premium page — **DONE**
- ✅ Skeleton loader + error state in GemStore — **DONE**
- ✅ Onboarding component (3 screens) — **DONE** (wire into Register.js)

### Week 2
- Remove sidebar → 5th "More" tab (FIX 3)
- Simplify Dashboard home tab to single hero CTA (FIX 4)
- Fix all touch targets to 44×44px minimum (FIX 9)
- Add skeleton + error state to: Spirits, Flashcards, SchoolFinder, Seasons, KnowledgeVault

### Week 3
- Build School Wars Arena mode
- Wire active skill system into Match.js (Spirit skill button)
- Add micro-interactions: coin fly, confetti burst, haptic, sound wiring
- Fix GemStore branding: Token → Gem, 🎫 → 💎, show dual balance

### Week 4
- Friend Lists + Squad system (Profile + new /friends page)
- Secret/hidden badges + Title system
- AI Quiz Generator from PDF/Video (extend AIQuestions.js)
- Seasons: cosmetic rewards + end-of-season distribution
- User test with 3–5 real students — watch without coaching

---

## Part 4 — Color Reference (Final Spec)

```
Page background:         #0A0F1E  ✅ correct
Card/surface:            #151929  ✅ (fixed from #111827)
Surface alt:             #1C2236  ✅ (fixed — creates depth)
Primary text:            #F1F5F9  ✅
Secondary text:          #C8D3F5  ✅ (fixed)
Muted/hint text:         #A8B8D8  ✅ (fixed from #8B99C7 — WCAG AA)
Input placeholder:       rgba(255,255,255,0.50)  ✅ (fixed from 0.22)
Input typed text:        #F1F5F9  ← set explicitly on all <input> elements

Primary purple:          #7C5CFF
Gold/XP:                 #FFC857
Red/danger:              #FF5A5F
Green/success:           #00D084
Blue/secondary:          #5B8CFF

NEVER: Purple text on purple/dark-purple background
NEVER: Text below 14px on dark background
NEVER: White text on light-coloured button
ALWAYS: Test outdoor readability (30% screen brightness)
```

---

## Part 5 — Files Changed in This Build

| File | What Changed |
|---|---|
| `src/App.js` | Added YouTubeGate gate logic, /subscribe route, fixed /upgrade redirect |
| `src/context/ThemeContext.js` | Raised textMuted, fixed surfaces, raised font-label minimum |
| `src/components/YouTubeGate.js` | **NEW** — fullscreen subscription gate |
| `src/components/Onboarding.js` | **NEW** — 3-screen mandatory onboarding |
| `src/pages/Subscribe.js` | **NEW** — dedicated Premium subscription page |
| `src/pages/Login.js` | Placeholder contrast: 0.22 → 0.50 |
| `src/pages/Register.js` | Placeholder contrast: 0.22 → 0.50 |
| `src/pages/ForgotPassword.js` | Placeholder contrast: 0.22 → 0.50 |
| `src/pages/GemStore.js` | Added skeleton loader + error retry state |

---

*This document should be committed to the repo and updated as each week's tasks are completed.*
*Last updated: June 2026 | Scholars Syndicate cbt-frontend*
