# The Real Ones

## Description

The Real Ones is a web app built for a specific friend group of 8. Each person fills out an anonymous 41-question survey covering self-reflection, honest peer assessments, and group dynamics. Once all have submitted, AI analysis pipeline powered by Claude Sonnet is generated that processes all 328 responses and generates an interactive dashboard. The dashboard reveals relationship heatmaps, role maps (giver vs taker, challenger vs comforter), trust scores, self-vs-group perception gaps, blind spots, and personal honor titles — giving the group an honest, data-driven mirror of who they are to each other.

Built with Next.js 16, TypeScript, Tailwind CSS, SQLite, Recharts, and the Anthropic Claude API. Deployed on Fly.io with a persistent SQLite volume.

**Live:** https://the-real-ones.fly.dev

---

## How to Run

### 1. Clone the repo

```bash
git clone https://github.com/yutatsukahara36/the-real-ones.git
cd the-real-ones
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database (`survey.db`) is created automatically on first request.

### 5. Using the app

- Each of the 8 friends selects their name on the landing page and completes the 41-question survey
- Once all 8 have submitted, go to `/admin` and click **Generate Analysis** to trigger the Claude AI pipeline
- View the group dashboard at `/dashboard` and individual summaries at `/dashboard/{name}`

### Running with Docker

```bash
docker build -t the-real-ones .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... -v $(pwd)/data:/data the-real-ones
```

### Deploying to Fly.io

```bash
fly launch
fly volumes create survey_data --region sjc --size 1 --yes
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```
