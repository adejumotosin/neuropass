# NeuroPass V1

NeuroPass is a mobile-first JAMB and WAEC preparation PWA designed specifically for students whose learning works better with ADHD-aware, dyslexia-aware, or otherwise flexible study architecture.

## What is implemented

- Student authentication demo and multi-step onboarding
- JAMB/WAEC subjects, track selection and guarantee acknowledgement
- Tiered 30 to 180 day track definitions
- Explainable live guarantee/projection engine
- Rolling compliance state machine and Crisis Mode protection logic
- 4-step learning loop: See It, Hear It, Recall It, Apply It
- Browser read-aloud and optional speech input fallback
- Spaced repetition scheduling logic: day 3, 7, 14, 30, then monthly
- Mistake Bank re-serving logic until 3 consecutive correct answers
- Low Energy Mode, Power Mode, Challenge Mode, XP, recovery-first skip flow
- Student home, study, practice, mocks, mistake bank, progress, coach and settings
- Mock telemetry for timing, flags, answer changes, early-vs-late accuracy and subject order
- Coach dashboard, risk queue, assigned student view, touchpoint workflow and escalation
- Admin content overview, licensed question import validation, guarantee operations, predictive rules, post-exam validation and launch readiness
- Results-first Share with Parent page
- CFA Coming Soon waitlist only
- Offline PWA shell, service worker, IndexedDB study packs and queued local progress
- Production database blueprint in `supabase/schema.sql` with RLS patterns and operational tables

## Important content limitation

The product scope says V1 should eventually contain the full JAMB 2000–2024 question bank and WAEC past questions, but that licensed content was not supplied to this build. The included 15 questions are **illustrative demo questions**, not official past questions. The admin import screen is designed for authorized CSV/JSON content and requires a rights confirmation.

## Important launch blockers

The private Admin > Launch Readiness page intentionally starts with these manual preconditions unresolved:

1. All guarantee language and financial terms must be reviewed by a Nigerian consumer protection lawyer.
2. Trained Learning Coaches must be recruited and available on launch day.

The UI should not be treated as legally launch-ready until those preconditions are completed.

## Run locally

This build has no mandatory package manager because the demo is a static, installable PWA.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

Use **Open interactive demo** on the sign-in screen. Use the role selector at the top to switch between Student, Learning Coach, Senior Coach and Admin demo views.

## Deploy

The repository is static and can be deployed directly on Vercel. `vercel.json` rewrites routes to `index.html` and sets service-worker cache headers.

## Production backend

`supabase/schema.sql` is a production-oriented starting schema. It includes users/roles, onboarding, accessibility settings, content, answers, sessions, spaced repetition, mistakes, mocks, compliance snapshots, projection model versions, risk signals, coach assignments, touchpoints, messages, guarantee cases, post-exam outcomes, imports, config, readiness and audit logs.

The current browser demo is deliberately local-first and does not embed production Supabase credentials. Before launch:

- provision Supabase
- run and review the schema
- finish and test all RLS policies
- connect email/password auth
- connect storage for licensed visuals/audio
- connect the admin content importer to server-side validation
- migrate demo state to real API queries/mutations
- run a security review

## Guarantee model

`engine.js` uses transparent V1 heuristic logic and includes the specific scope examples as anchors. The interface marks projections as model estimates. Post-exam outcomes are stored in a structure intended for future recalibration.

No track guarantees 400/400. The maximum advertised guaranteed minimum is 395/400 on the 180-day Perfect track.
