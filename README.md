# PLAY//LEARN — GitHub Pages Site

Web-first prototype repository for PLAY//LEARN.

## Current build
- Product landing page
- Robotics campaign overview: 10 Acts / 60 core missions
- Playable V005 Mission 01: KNOW WHICH WAY IS UP
- Static JSON campaign data
- GitHub Pages compatible; no build step required

## Local preview
Because the home page loads JSON with `fetch`, serve the folder through a local HTTP server.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages deployment
This repository is intentionally static.

In GitHub:
1. Create a repository, suggested name: `play-learn`
2. Put these files on the `main` branch
3. Open **Settings → Pages**
4. Choose **Deploy from a branch**
5. Select `main` and `/(root)`
6. Save

GitHub Pages will use the root `index.html`.

## Architecture direction
GitHub Pages hosts only static front-end files.

Later:
- accounts/save data need a backend/service
- AI Coach calls must go through a server-side proxy or serverless function
- never place a private AI API key in browser JavaScript

## Project status
Current vertical slice is intentionally deterministic and educational. Its fictional training values do not represent any real-world commercial robot specifications or performance.


## V005
Mission 01 now implements the full learning loop without required multiple-choice questions:
Hook → Discover → Manipulate → Connect → Cause/Effect → Guided Test → Transfer → Complete.

The player directly tilts the robot, toggles the IMU, repairs the sensing-to-estimation connection, tunes sensor timing, passes a stand test, then diagnoses a separate control-latency fault.
