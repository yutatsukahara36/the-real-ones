# The Real Ones

**An honest look at us.**

A web app that collects anonymous-style survey responses from a close friend group of 8, runs them through AI analysis, and generates an interactive dashboard revealing group dynamics, relationship heatmaps, blind spots, and honor titles.

**Live:** [https://the-real-ones.fly.dev](https://the-real-ones.fly.dev)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [App Flow](#app-flow)
- [Survey Structure](#survey-structure)
- [AI Analysis Pipeline](#ai-analysis-pipeline)
- [Dashboard](#dashboard)
- [Personal Summary Pages](#personal-summary-pages)
- [Admin Panel](#admin-panel)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Local Development](#local-development)

---

## Overview

The Real Ones is built for a specific friend group of 8 people:

| Name | Color | Profile |
|------|-------|---------|
| Yuta | `#FF6B6B` | Organizer, keeps everyone connected |
| Satvik | `#4ECDC4` | Hype man, brings energy |
| Ty | `#45B7D1` | The chill one, balances the group |
| Noah | `#96CEB4` | Ambitious, pushes people |
| Hojeong | `#FFEAA7` | The glue, bridges gaps |
| Koji | `#DDA0DD` | Creative one, unique perspectives |
| Kenshin | `#98D8C8` | Reliable, consistent |
| Hikaru | `#F7DC6F` | Thoughtful, notices things |

Each person fills out a 41-question survey about themselves, each other friend, and the group as a whole. Once all 8 submit, an admin triggers AI analysis that generates a rich interactive dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| AI | Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk` |
| Charts | Recharts |
| Deployment | Fly.io (Docker, persistent volume) |
| Images | Supabase Storage (profile pictures) |

---

## App Flow

```
Landing Page (/)
    │
    ├── Select your name from dropdown
    ├── Check if already submitted → block re-entry
    └── Start → Survey
            │
            ├── 3 screens: About You (self-reflection)
            ├── 35 screens: About Each Friend (7 people × 5 questions)
            ├── 3 screens: About The Group
            └── Submit → "Done. Your honesty matters."
                    │
                    └── Admin generates dashboard when all 8 are in
                            │
                            ├── /dashboard → Group-wide analytics
                            └── /dashboard/{name} → Personal summary
```

---

## Survey Structure

### Step 1: About You (3 screens)

| ID | Question |
|----|----------|
| 1.1 | What role do you play in this group? Be honest. |
| 1.2 | What do you take from this group? What do you give? |
| 1.3 | How would this group change if you left tomorrow? |

### Step 2: About Each Person (7 people × 5 questions = 35 screens)

For each of the other 7 friends:

| ID | Question |
|----|----------|
| 2.1 | What does {Name} give to the group? What do they take? |
| 2.2 | Does {Name} challenge you or comfort you? How? |
| 2.3 | How would your life change if {Name} wasn't in it? |
| 2.4 | Would you call {Name} at your worst moment? Why or why not? |
| 2.5 | Describe your relationship with {Name} in one honest sentence. |

### Step 3: The Group (3 screens)

| ID | Question |
|----|----------|
| 3.1 | What's the best thing about this group? |
| 3.2 | What's the thing nobody says but everyone feels? |
| 3.3 | Where does this group need to grow? |

### Survey UX
- Progress bar at top with step counter (e.g. "15 / 41")
- Minimum 20 characters per answer to proceed
- Back button for navigation (except first screen)
- One submission per person, enforced server-side
- No editing after submission
- Person's name displayed prominently on peer questions

**Total: 41 screens per respondent. 328 screens across all 8.**

---

## AI Analysis Pipeline

Triggered from the admin panel after all 8 friends submit. Sends all raw survey data to Claude Sonnet with a structured prompt requesting a JSON response.

### What the AI generates:

#### 1. Role Map (per person)
- **x-axis**: Taker (-10) to Giver (+10) — derived from Q2.1
- **y-axis**: Keeps Comfortable (-10) to Pushes Up (+10) — derived from Q2.2
- Self-perception scores from Q1.2
- 2-3 sentence hover insight

#### 2. Real One Map (per person)
- **x-axis**: Life Impact (1-10) — derived from Q2.3
- **y-axis**: Worst Moment Trust (1-10) — derived from Q2.4
- Self-perception scores from Q1.3
- 2-3 sentence hover insight

#### 3. Relationship Heatmap (56 directional pairs)
- Heat score 1-10 per pair — derived from Q2.3 + Q2.4 + Q2.5
- One-liner sentence capturing the essence of how person A feels about person B
- Asymmetry is intentional (A→B ≠ B→A)

#### 4. Self vs Group Gap (per person)
- Comparison of where they placed themselves vs where the group placed them
- One sentence on their biggest blind spot

#### 5. Group Insights
- **Best thing**: synthesized from Q3.1 responses
- **Unspoken truth**: synthesized from Q3.2 responses
- **Growth area**: synthesized from Q3.3 responses

#### 6. Next Steps (5 recommendations)
- Specific, actionable advice for strengthening the group bond
- Based on actual patterns in the survey data

#### 7. Avoid (4-5 entries)
- Bad habits or patterns the group should stop
- Each with an explanation of why it's harmful

#### 8. Honor Titles (6 unique awards)
Each person can only win one title. All 6 winners must be different.

| Key | Title | Emoji | Description |
|-----|-------|-------|-------------|
| microwave | The Microwave | 🔥 | Blasts the vibe up. Life of the party. |
| leader | The Leader | 👑 | The friend group leader. |
| group_clown | Group Clown | 🤡 | The funniest one. |
| grinder | The Grinder | 💪 | Most disciplined and career-oriented. |
| retard | The Unhinged | 🧠 | Most insane and out of pocket. |
| nigga | The Nigga | 🫡 | Just is. |

---

## Dashboard

**Route:** `/dashboard`

Only accessible after analysis has been generated. Single scrollable page with 8 sections.

### Section 1: Personal Reviews
Grid of 8 cards with profile pictures. Each links to `/dashboard/{name}` for that person's full personal summary.

### Section 2: The Role Map
Interactive scatter plot (quadrant chart).
- Dots labeled with each person's name
- Color-coded per person
- Self-placement shown as faded dashed circles connected by dotted lines to group-placement
- Quadrant labels: TAKER / GIVER / COMFORT / GROWTH
- Name filter bar: toggle individuals on/off, All/Clear buttons
- Hover tooltips with AI-generated insights
- Below: Self vs Group gap cards for each person

### Section 3: The Real One
Same interactive scatter plot format.
- X: Life Impact (low → high)
- Y: Worst Moment Trust (low → high)
- Same filtering and hover features

### Section 4: Relationship Heatmap
8×8 color-coded grid.
- Rows = "how I feel about..." / Columns = each person
- Blue (cold, low score) → Red (hot, high score)
- Diagonal blank (no self-rating)
- Numbers displayed in each cell
- Hover: glow effect + tooltip with one-liner insight
- Color-coded row/column headers that link to personal pages
- Asymmetry is clearly visible

### Section 5: Group Insights
Three cards: Our Strength, The Unspoken Truth, Where We Grow.

### Section 6: Honor Titles
Grid of 6 award cards. Each shows:
- Emoji + title + description
- Winner's profile picture and name
- AI-generated reason from survey data

### Section 7: Next Steps
5 numbered cards with actionable recommendations.

### Section 8: Avoid
Warning cards with red-tinted theme showing bad habits to cut.

### Design
- Dark theme (#0a0a0a background)
- Fade-in animations
- Mobile responsive
- Geist Sans / Geist Mono fonts
- Premium, personal feel — not corporate

---

## Personal Summary Pages

**Route:** `/dashboard/{name}` (e.g. `/dashboard/Yuta`)

Accessible by clicking any name on the main dashboard. Back link to return.

### Header
- Profile picture (64px, circular, with colored ring accent)
- Name in their assigned color
- "Personal review summary" subtitle

### Section 1: In Your Own Words
Their raw self-answers displayed in 3 cards:
- Your role in the group (Q1.1)
- What you give & take (Q1.2)
- If you left tomorrow (Q1.3)

### Section 2: Where You Stand
Two mini quadrant maps side-by-side:
- **The Role Map**: shows their dot position with self vs group placement
- **The Real One**: same format
- Each shows exact coordinates + AI hover insight

### Section 3: The Blind Spot
Single prominent card with the AI-generated gap insight — what they don't see about themselves.

### Section 4: How Others See You
- Average heat score displayed
- Horizontal heat bars sorted by score (highest first)
- Each bar shows: profile pic, name, colored bar, score, one-liner on hover

### Section 5: How You See Others
- Same format but showing their outgoing scores
- Average displayed

### Section 6: What They Said About You
Raw quotes from every friend, organized by question:
- Give & take (Q2.1)
- Challenge or comfort (Q2.2)
- Life without them (Q2.3)
- Call at worst moment (Q2.4)
- One honest sentence (Q2.5)

Each quote attributed with the respondent's profile picture and name.

---

## Admin Panel

**Route:** `/admin`
**Password:** `kojigoons` (client-side gate)

### Features

#### Submission Status
- Shows 8 green/gray dots with names
- Submission date for each person who completed
- Per-person "Reset" button next to submitted names

#### View Raw Responses
- Toggle button to expand/collapse
- Accordion per submitted person
- Shows all answers organized by:
  - About Themselves (3 self-questions with labels)
  - About {Target} (5 questions per friend, grouped by target name)
  - About the Group (3 group questions with labels)

#### Export All Data
- Downloads `survey-export.json`
- Contains: respondents, selfAnswers, peerAnswers, groupAnswers

#### Generate Dashboard
- Disabled until all 8 submit
- Triggers Claude AI analysis (~30-60 seconds)
- Shows success/error feedback
- Can be re-run to overwrite previous analysis

#### View Dashboard
- Link appears after analysis is generated

#### Per-Person Reset
- Deletes that person's responses
- Deletes everything others wrote about them
- Clears dashboard analysis (now stale)
- Requires confirmation dialog

#### Reset Everything
- Red button at bottom
- Deletes all responses, all analysis
- Everyone must re-submit
- Requires confirmation dialog

### Confirmation Dialogs
Every destructive action shows a modal overlay with:
- Title describing the action
- Message explaining exactly what gets deleted
- Cancel button
- Red "Delete" confirmation button

---

## Database Schema

SQLite database at `/data/survey.db` (production) or `./survey.db` (development).
WAL mode enabled. Foreign keys enabled.

### respondents
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | UNIQUE NOT NULL |
| submitted_at | TEXT | NOT NULL |

### self_answers
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| respondent_name | TEXT | NOT NULL |
| question_id | TEXT | NOT NULL (1.1, 1.2, 1.3) |
| answer | TEXT | NOT NULL |
| | | UNIQUE(respondent_name, question_id) |

### peer_answers
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| respondent_name | TEXT | NOT NULL |
| target_name | TEXT | NOT NULL |
| question_id | TEXT | NOT NULL (2.1-2.5) |
| answer | TEXT | NOT NULL |
| | | UNIQUE(respondent_name, target_name, question_id) |

### group_answers
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| respondent_name | TEXT | NOT NULL |
| question_id | TEXT | NOT NULL (3.1, 3.2, 3.3) |
| answer | TEXT | NOT NULL |
| | | UNIQUE(respondent_name, question_id) |

### analysis_results
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| generated_at | TEXT | NOT NULL |
| result_json | TEXT | NOT NULL |

---

## Project Structure

```
the-real-ones/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, metadata)
│   │   ├── globals.css                   # Dark theme, animations
│   │   ├── page.tsx                      # Landing page (name select)
│   │   ├── survey/
│   │   │   └── page.tsx                  # 41-screen multi-step survey
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Main dashboard (all charts)
│   │   │   └── [name]/
│   │   │       └── page.tsx              # Personal summary page
│   │   ├── admin/
│   │   │   └── page.tsx                  # Admin panel (password-gated)
│   │   └── api/
│   │       ├── check-submission/
│   │       │   └── route.ts              # GET: check if name submitted
│   │       ├── submit/
│   │       │   └── route.ts              # POST: save survey responses
│   │       ├── dashboard/
│   │       │   ├── route.ts              # GET: fetch analysis results
│   │       │   └── [name]/
│   │       │       └── route.ts          # GET: personal analysis data
│   │       └── admin/
│   │           ├── route.ts              # GET: submission status
│   │           ├── export/
│   │           │   └── route.ts          # GET: dump all data as JSON
│   │           ├── generate/
│   │           │   └── route.ts          # POST: trigger AI analysis
│   │           └── reset/
│   │               ├── route.ts          # POST: reset everything
│   │               └── [name]/
│   │                   └── route.ts      # POST: reset specific person
│   └── lib/
│       ├── constants.ts                  # Friends, questions, pics, config
│       └── db.ts                         # SQLite connection + schema
├── public/                               # Static assets
├── Dockerfile                            # Multi-stage Node 20 Alpine build
├── fly.toml                              # Fly.io config (sjc, volume, auto-stop)
├── .dockerignore
├── .env.example                          # ANTHROPIC_API_KEY placeholder
├── next.config.ts                        # Standalone output, external packages
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API Reference

### `GET /api/check-submission?name={name}`
Check if a person has already submitted.
- **Response:** `{ submitted: boolean }`

### `POST /api/submit`
Submit all survey responses for a person.
- **Body:** `{ respondent, selfAnswers, peerAnswers, groupAnswers }`
- **Response:** `{ success: true }` or `409` if already submitted

### `GET /api/dashboard`
Fetch the latest analysis results.
- **Response:** `{ available: boolean, data?: AnalysisData }`

### `GET /api/dashboard/{name}`
Fetch personal analysis + raw answers for a specific person.
- **Response:** `{ available, name, analysis, selfAnswers, aboutThem, aboutOthers }`

### `GET /api/admin`
Fetch submission status and stats.
- **Response:** `{ friends, submitted, submittedNames, totalResponses, allSubmitted, hasAnalysis }`

### `GET /api/admin/export`
Export all raw data as JSON.
- **Response:** `{ respondents, selfAnswers, peerAnswers, groupAnswers }`

### `POST /api/admin/generate`
Trigger AI analysis. Requires all 8 submitted.
- **Response:** `{ success: true, analysis }` or error

### `POST /api/admin/reset`
Delete all data (responses + analysis).
- **Response:** `{ success: true }`

### `POST /api/admin/reset/{name}`
Delete a specific person's data + analysis.
- **Response:** `{ success: true }`

---

## Deployment

### Infrastructure
- **Platform:** Fly.io
- **Region:** San Jose, CA (sjc)
- **VM:** shared-cpu-1x, 512MB RAM
- **Volume:** 1GB persistent volume at `/data` for SQLite
- **Auto-scaling:** Auto-stop when idle, auto-start on request

### Deploy Commands
```bash
# First time
fly launch
fly volumes create survey_data --region sjc --size 1 --yes
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Subsequent deploys
fly deploy
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Set via `fly secrets set`. |

---

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run dev server
npm run dev

# Open http://localhost:3000
```

Database is created automatically at `./survey.db` on first request.
