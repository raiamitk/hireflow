# HireFlow — Local Package
AI Mock Interview Framework  
Built with Claude · MediaPipe · Anthropic API

---

## Files

| File | Description |
|------|-------------|
| `hireflow-v2.html` | **Main app** — full mock interview with setup wizard, Claude-generated questions, live signals, screenshot mistake capture, retake support, AI coaching feedback |
| `hireflow-facemesh.html` | **Face Mesh module** — standalone MediaPipe Face Mesh signal engine; open this to test facial analysis independently |
| `README.md` | This file |

---

## How to run

Just open the HTML files directly in Chrome or Edge:

```
open hireflow-v2.html          # macOS
start hireflow-v2.html         # Windows
xdg-open hireflow-v2.html      # Linux
```

No server needed. No npm. No install.

> **Note:** MediaPipe loads from the jsdelivr CDN, so you need an internet connection for Face Mesh to work. Everything else (Claude API calls, camera, UI) works with a live connection to api.anthropic.com.

---

## Setup (first run)

1. Open `hireflow-v2.html`
2. Enter your **role** and **company**
3. Optionally paste a JD or upload your resume (.txt works best locally)
4. Enter your **Anthropic API key** (`sk-ant-...`) on step 3
   - Get one at https://console.anthropic.com
   - It's stored only in the browser session — never persisted
5. Hit **Generate questions** — Claude will create tailored questions
6. Click **Start** in the interview screen, grant camera permission
7. After each answer, switch to the **AI Feedback** tab for Claude's coaching

---

## Face Mesh integration

The Face Mesh module writes real-time signals to `window.HireFlowFaceSignals`:

```js
{
  eyeContact: 78,        // 0-100
  confidence: 65,
  stress: 32,
  engagement: 84,
  smile: 45,
  browFurrow: 18,
  dominantEmotion: "confident",  // confident | anxious | neutral | distracted
  emotionScores: { confident: 72, anxious: 12, neutral: 10, distracted: 6 },
  timestamp: 1718000000000
}
```

In `hireflow-v2.html`, click **Face Mesh: off** (bottom bar, only visible while recording) to enable it. The signal bars switch from simulated values to live MediaPipe data automatically.

---

## What's simulated vs real

| Feature | Status |
|---------|--------|
| Question generation | **Real** — Claude API |
| AI coaching feedback | **Real** — Claude API |
| Facial signals (MediaPipe) | **Real** when Face Mesh enabled; simulated otherwise |
| Live transcript | Simulated (sample answers) — connect AssemblyAI/Deepgram for real |
| Company research (Glassdoor) | Simulated loading — needs a backend proxy for real scraping |
| Speech tone/WPM/fillers | Simulated — wire up Web Speech API or AssemblyAI |
| PDF report | Exports as .txt — use jsPDF for a real PDF |

---

## Next steps (backend)

To make the remaining features real, scaffold a FastAPI backend:

```
POST /transcribe     — receives audio chunks, returns AssemblyAI transcript + tone scores
POST /research       — proxies Glassdoor/LinkedIn scrape, returns company context
POST /report/pdf     — generates a formatted PDF from session data
```

The frontend already sends structured data — just swap the simulated values for real API responses.

---

## Signals computed by MediaPipe

- **Eye contact** — iris landmark offset from eye centre, normalised by eye width (lm 468/473)
- **Smile** — lip corner distance (lm 61/291) normalised by face width, 20-frame rolling average
- **Brow furrow** — inner brow (lm 22/52) to nose bridge (lm 168) distance, normalised by face height
- **Engagement** — head pose yaw/pitch deviation from neutral (lm 1 vs lm 168)
- **Stress** — 0.5 × brow + 0.3 × (1 − eye) + 0.2 × (1 − engagement)
- **Confidence** — 0.4 × eye + 0.3 × (1 − stress) + 0.3 × smile

---

Built with HireFlow v2 · April 2026
