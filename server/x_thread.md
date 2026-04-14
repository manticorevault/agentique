Andrej Karpathy just open-sourced Autoresearch — the biggest unlock for solo ML researchers.

It lets AI agents (like Claude) run 100+ experiments overnight while you sleep.

Here's how to 10x Claude's research output with it 🧵

---

The concept is simple but powerful:

1. Give Claude a real LLM training setup (single GPU, 5-min budget)
2. Let it modify code, train, evaluate
3. Keep changes that improve validation loss
4. Repeat indefinitely

Roughly 12 experiments per hour. ~100 overnight.

---

The repo is intentionally minimal — just 3 files:

• prepare.py (read-only data prep)
• train.py (what Claude edits)
• program.md (your "research constitution")

Claude modifies train.py, commits, runs, evaluates, and either keeps or resets. No human bottleneck.

---

The "simplicity criterion" is the secret sauce:

All else equal, simpler wins.

A 0.001 improvement from deleting code > same gain from adding 20 lines of hacks.

This keeps the model maintainable after 100 iterations — rare in ML research.

---

I documented the full Claude + Autoresearch integration:

• Hardware requirements & config
• The full autonomous experiment loop
• Tuning for MacBook vs H100
• Exact prompts that work

→ [link to blog post]

71k+ stars. This is the future of ML research.

---

Follow-up quote tweets for days 2-3:

**Day 2, 10 AM — Hardware democratization:**
One underrated thing about Autoresearch + Claude:

It finds the optimal model FOR YOUR HARDWARE.

H100 trains a bigger model. MacBook trains smaller. Both converge to their best possible config in 5 minutes.

The playing field just got more level.

**Day 2, 4 PM — The meat computer era:**
Karpathy's quote in the README hits hard:

"One day, frontier AI research used to be done by meat computers in between eating, sleeping, having other fun... That era is long gone."

The "meat computer" (you) is now the bottleneck. Not the compute. Not the ideas. Just your attention.

**Day 3, 9 AM — Markdown as programming:**
The most underrated part of Autoresearch with Claude:

You don't write Python configs. You write Markdown hypotheses.

"Try SwiGLU activation"
"Explore shallower, wider architectures"
"Test different learning rate schedules"

Claude translates your research direction into code changes.

**Day 3, 2 PM — Community forks:**
Autoresearch now runs on:
• macOS (miolini's fork)
• Apple MLX (trevin-creator)
• Windows RTX (jsegow)
• AMD GPUs (andyluo7)

You don't need an H100 anymore.

Here's the tuning guide for smaller hardware 👇

---

**Engagement tactics:**

**First Hour (Critical):**
- 5-8 team members retweet/quote-tweet within 60 minutes
- Reply to every comment with substance (not just "thanks!")
- Quote-tweet anyone with >10K followers who engages
- Like all replies (signals algorithm)

**Hours 2-3:**
- Continue substantive replies
- Monitor for screenshots/mentions
- Share interesting replies to #amplify channel

**Days 2-7:**
- Pin launch tweet to profile
- Post follow-up angles (see above)
- Quote-tweet interesting discussions about Autoresearch
- Monitor who's engaging — potential future collaborators