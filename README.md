# Mission

**Personal AI memory you own. Local, portable, never on anyone's cloud.**

Mission is a dedicated graphite card that holds your personal AI memory: your work, health, habits, people, goals and preferences. Plug it into your laptop by USB-C and Claude, ChatGPT, Grok, Muse or any other agent can use your full context. Pull it out and their access ends instantly.

A local AI on your laptop keeps that memory current from the signals in your life (calendar, location, fitness tracker, notes, email), acting as a private chief of staff. Over time the card itself will pick up its own signals, such as location, voice and NFC.

This repository is the marketing site and Mission Studio for [amission.si](https://amission.si).

## What's here

- **Landing site:** scroll-driven story of the card, from plugging into a laptop and agents connecting, to the card opening up to show its internals, and what Mission captures across Digital, Life and Health.
- **Mission Studio:** an interactive designer where you build your own card and add hardware features such as NFC, location and microphone.
- **Waitlist:** a serverless endpoint that stores sign-ups along with each Studio design.

## Stack

TypeScript, React (TanStack Start on Vite), Tailwind, GSAP with ScrollTrigger, Lenis smooth scroll, and React Three Fiber for the 3D card. Deployed on Vercel.

## Run locally

Requires Node.js 20+ and npm.

```sh
git clone https://github.com/dannybarr/MissionSI.git
cd MissionSI
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm test`.

## Status

Pre-launch. The hardware shown on the site is a concept, and the final component layout is subject to engineering.

© Mission. All rights reserved.
