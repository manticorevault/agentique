# Distribution Plan: Karpathy's Autoresearch Blog Post

## Launch Overview
- **Content**: Blog post on Karpathy's Autoresearch + Claude integration
- **Target Audience**: ML engineers, AI researchers, indie developers, solo builders, Claude users
- **Launch Tier**: Tier 2 (significant content, not product launch)
- **Publish Date**: 2026-04-13
- **Primary Angle**: Practical setup guide + hardware democratization story

---

## Distribution Philosophy

**Two core principles:**
1. **Go wide, then double down.** Post to every relevant channel on launch day. You won't know which one hits. After launch, invest more in what worked.
2. **Launch is day one.** The initial push drives awareness, but the long tail — SEO, word of mouth, community — drives sustained growth.

---

## Pre-Launch Asset Checklist

### Critical (Must Have)
- [ ] Blog post published with canonical URL
- [ ] Open Graph tags: title, description, image (1200x628)
- [ ] Twitter/X Card validator tested
- [ ] LinkedIn Post Inspector tested
- [ ] UTM parameters configured for all links
- [ ] Hero image: 1200x628px, <1MB, keyword in filename

### Social Copy Ready
- [ ] X/Twitter: 4 posts drafted (launch + 3 follow-ups)
- [ ] LinkedIn: Personal + company posts drafted
- [ ] Reddit: 3 subreddit variants prepared
- [ ] HN: Submission title + backup text post
- [ ] Email: Subject lines + body copy

### Internal Setup
- [ ] #amplify channel created in Slack/Teams
- [ ] Team calendar blocks for launch day monitoring
- [ ] Personal outreach list: 10-15 ML influencers
- [ ] Direct links to posts ready for easy sharing

---

## Channel Strategy Summary

| Channel | Priority | Format | Timing | Expected Reach |
|---------|----------|--------|--------|----------------|
| X/Twitter | Primary | Thread + standalone | 8 AM PST | High volume |
| Reddit | High | Text posts | 10 AM PST | High quality |
| LinkedIn | High | Personal post | 9 AM PST | B2B decision-makers |
| Hacker News | High | "Show HN" | 7 AM PST | Viral lottery |
| BlueSky | Medium | Cross-post | With X | Growing audience |
| Threads | Medium | Cross-post | With X | Low competition |
| Email | Medium | Newsletter | 11 AM PST | Owned audience |
| Dev.to | Low | Syndication | Day 2 | Developer reach |

**Channel-Specific Goals:**
- X/Twitter: Drive initial awareness, algorithmic cascade to other channels
- Reddit: High-quality technical discussion, long-tail SEO
- LinkedIn: B2B reach, professional credibility
- HN: Massive traffic if it hits, technical validation

---

## X/Twitter Content

### X/Twitter Strategy Notes
**Why X matters:** Default launch channel for tech. Early engagement (first 60-90 min) determines reach. Strong X performance cascades to other platforms (screenshots → LinkedIn, links → Reddit).

**Critical Success Factors:**
- First 60-90 minutes determine algorithmic reach
- Have 5-8 people with relevant audiences ready to retweet within first hour
- Engage with EVERY reply in first 2-3 hours (substantive responses, not just likes)
- Pin launch tweet for full launch week

### Primary Launch Tweet (Thread)

**Tweet 1/5 — The Hook (Strongest line first):**
```
Andrej Karpathy just open-sourced Autoresearch — and it might be the biggest unlock for solo ML researchers yet.

It lets AI agents run 100+ experiments overnight while you sleep.

Here's how to use it with Claude to supercharge your research 🧵
```
*Why this works: Names authority figure (Karpathy), quantifies benefit (100+), promises actionable guide.*

**Tweet 2/5 — The Mechanism:**
```
The concept is simple but powerful:

1. Give an AI agent a real LLM training setup (single GPU, 5-min budget)
2. Let it modify code, train, evaluate
3. Keep changes that improve validation loss
4. Repeat indefinitely

Roughly 12 experiments per hour. ~100 overnight.
```
*Why this works: Numbers make it concrete, "overnight" implies passive value.*

**Tweet 3/5 — The Architecture:**
```
The repo is intentionally minimal — just 3 files:

• prepare.py (read-only data prep)
• train.py (what the agent edits)
• program.md (your "research constitution")

The agent modifies train.py, commits, runs, evaluates, and either keeps or resets. No human bottleneck.
```
*Why this works: Specificity builds credibility, "3 files" makes it approachable.*

**Tweet 4/5 — The Insight:**
```
The "simplicity criterion" is the secret sauce:

All else equal, simpler wins.

A 0.001 improvement from deleting code > same gain from adding 20 lines of hacks.

This keeps the model maintainable after 100 iterations — rare in ML research.
```
*Why this works: Contrarian insight (simpler > complex), specific number adds credibility.*

**Tweet 5/5 — The CTA:**
```
I wrote a complete setup guide covering:

• Hardware requirements & config
• The full experiment loop
• Tuning for MacBook vs H100
• Practical tips for better results

→ [link]

71k+ stars. This is the future of ML research.
```
*Why this works: Clear value proposition, social proof (71k stars), aspirational close.*

### Follow-up Quote Tweets (Days 2-3)

**Quote-tweet your own launch** with different angles to extend reach without repeating yourself.

**Angle 1 - Hardware democratization (Day 2, 10 AM):**
```
One underrated thing about Autoresearch:

It finds the optimal model FOR YOUR HARDWARE.

H100 trains a bigger model. MacBook trains smaller. Both converge to their best possible config in 5 minutes.

The playing field just got more level.
```
*Audience: Indie developers, resource-constrained researchers*

**Angle 2 - The meat computer era (Day 2, 4 PM):**
```
Karpathy's quote in the README hits hard:

"One day, frontier AI research used to be done by meat computers in between eating, sleeping, having other fun... That era is long gone."

The "meat computer" (you) is now the bottleneck. Not the compute. Not the ideas. Just your attention.
```
*Audience: Philosophically-minded technologists*

**Angle 3 - Markdown as programming (Day 3, 9 AM):**
```
The most underrated part of Autoresearch:

You don't write Python configs. You write Markdown hypotheses.

"Try SwiGLU activation"
"Explore shallower, wider architectures"
"Test different learning rate schedules"

Claude translates your research direction into code changes.
```
*Audience: Prompt engineers, Claude power users*

**Angle 4 - Community forks (Day 3, 2 PM):**
```
Autoresearch now runs on:
• macOS (miolini's fork)
• Apple MLX (trevin-creator)
• Windows RTX (jsegow)
• AMD GPUs (andyluo7)

You don't need an H100 anymore.

Here's the tuning guide for smaller hardware 👇
```
*Audience: Mac/Windows/AMD users who thought they were excluded*

### X Engagement Tactics

**First Hour (Critical):**
- [ ] 5-8 team members retweet/quote-tweet within 60 minutes
- [ ] Reply to every comment with substance (not just "thanks!")
- [ ] Quote-tweet anyone with >10K followers who engages
- [ ] Like all replies (signals algorithm)

**Hours 2-3:**
- [ ] Continue substantive replies
- [ ] Monitor for screenshots/mentions
- [ ] Share interesting replies to #amplify channel

**Days 2-7:**
- [ ] Pin launch tweet to profile
- [ ] Post follow-up angles (see above)
- [ ] Quote-tweet interesting discussions about Autoresearch
- [ ] Monitor who's engaging — potential future collaborators

---

## Reddit Content

### Reddit Strategy Notes
**Why Reddit matters:** Underrated launch channel. High discussion quality, technical audience, long shelf life (posts surface in search for months). Niche subreddits (10K-100K members) often convert better than giant ones.

**Critical Success Factors:**
- Lurk before posting — if you've never participated, it'll feel like drive-by spam
- Read subreddit rules carefully (many ban self-promotion)
- Best format: "I built X to solve Y" — genuine story, not advertisement
- Show vulnerability (what you got wrong, what's rough)
- Engage with every comment — check back at 12 and 24 hours

---

### r/MachineLearning Post

**Best time:** Tuesday-Thursday, 10 AM PST  
**Subreddit rules:** Check current rules on self-promotion (varies)  
**Expected reception:** Technical deep-dives, methodology questions

**Title:** I wrote a deep dive on using Karpathy's Autoresearch with Claude — 100 experiments overnight on a single GPU

**Body:**
```
Hey r/MachineLearning — I've been experimenting with Karpathy's newly open-sourced Autoresearch framework and wanted to share a comprehensive setup guide.

**What it is:**
Autoresearch lets an AI agent (Claude, etc.) autonomously run ML experiments. You give it a 5-minute training budget per experiment, and it iterates on hyperparameters, architecture, and optimizer settings while you sleep.

**My experience:**
- Set it up on an H100 (also works on smaller GPUs with tweaks)
- The agent ran ~12 experiments per hour
- It follows a strict protocol: modify → commit → train → evaluate → keep or reset
- Everything is logged to results.tsv for analysis

**The interesting part:**
The framework has a "simplicity criterion" — all else equal, simpler code wins. This prevents the agent from building an incomprehensible tangle of optimizations over 100+ iterations. I've found the resulting models are actually maintainable, which is rare for autotuned systems.

**Hardware flexibility:**
The 5-minute wall-clock budget means it optimizes for YOUR hardware. An H100 finds different optimal configs than a MacBook, but both find their best possible model within the constraint.

**Full guide covers:**
- Complete setup with uv
- The experiment loop in detail
- Tuning for different hardware (including MacBook/consumer GPUs)
- Tips for writing better program.md "research constitutions"
- What to expect from the results

[Link to full post]

Happy to answer questions about setup, results, or weird behaviors you've seen. The project is still new so we're all figuring out the best practices.
```

---

### r/LocalLLaMA Post

**Best time:** Tuesday-Thursday, 10 AM PST (stagger from r/MachineLearning)  
**Why this subreddit:** Exactly the audience — local LLM enthusiasts, hardware-conscious  
**Expected reception:** Very positive, hardware-specific questions

**Title:** Autoresearch now has 71k stars — here's how to run it on consumer hardware (MacBook, AMD, Windows)

**Body:**
```
For those who saw Karpathy's Autoresearch release but thought "I don't have an H100" — there are active forks adding support for:

• macOS (Apple Silicon)
• AMD GPUs
• Windows
• Byte-level tokenizers (256 vocab vs 32k)
• TinyStories dataset (smaller, faster)

**The key adjustments for smaller hardware:**
- Lower DEPTH from 8 → 4
- Reduce MAX_SEQ_LEN to 256
- Use TinyStories instead of FineWeb
- Switch to byte-level tokenizer
- Still get meaningful experiments, just smaller models

I wrote a guide covering both the H100 setup and the consumer GPU adaptations:

[Link to full post]

The "100 experiments overnight" promise actually scales down reasonably well — you might get 50 meaningful iterations on a MacBook Pro instead of 100 on an H100, but the autonomous loop works the same.

Anyone tried the forks? Curious about real-world performance on M1/M2/M3 chips.
```

---

### r/ClaudeAI Post

**Best time:** Any weekday, 11 AM PST  
**Why this subreddit:** Highly relevant, Claude-focused audience  
**Expected reception:** Setup questions, prompt engineering interest

**Title:** How to use Claude for autonomous LLM research: A practical guide to Karpathy's Autoresearch

**Body:**
```
Hey r/ClaudeAI — I wrote a guide on using Claude with Karpathy's Autoresearch framework after getting it running on my setup.

**The setup:**
Autoresearch gives Claude (or similar agents) a constrained ML training environment. The agent reads program.md (your research instructions), modifies train.py, runs a 5-minute training experiment, evaluates results, and decides whether to keep or revert the change.

**Why it works well with Claude:**
- Single-file scope (only touches train.py) keeps changes reviewable
- Clear success metric (val_bpb — lower is better)
- Markdown as programming (you write hypotheses, Claude implements)
- Autonomous iteration loop matches Claude's strengths

**Exact prompts that work:**
I found Claude responds well to structured instructions in program.md:

```
Hypothesis: SwiGLU activation will outperform GELU
Try: Replace activation in MLP blocks
Constraint: Must complete in 5 minutes
```

Claude translates this into the actual code change, runs the experiment, and reports back.

**Full guide includes:**
- Step-by-step setup with uv
- Example program.md files that work
- Hardware tuning for different setups
- What to expect from 100 overnight experiments

[Link to full post]

Has anyone else tried Autoresearch with Claude? Curious about your prompts and results.
```

---

### r/huggingface Post (Optional)

**Best time:** Wednesday, 9 AM PST  
**Angle:** Dataset and tokenizer integration

**Title:** Guide: Using TinyStories and custom tokenizers with Karpathy's Autoresearch

**Body:**
```
For those experimenting with Karpathy's Autoresearch, I wrote a guide covering dataset selection and tokenizer configuration — especially important if you're on smaller hardware.

**Key finding:**
The default FineWeb dataset works for H100s, but TinyStories (available on Hugging Face) is much better for consumer GPUs. Lower entropy, smaller vocab requirements, faster training.

**Tokenizer options:**
- Default: 8192 vocab (needs compute)
- Byte-level: 256 vocab (works anywhere)
- Custom: Train your own on domain data

The guide includes the exact config changes needed for each setup.

[Link to full post with configs]

Anyone tried custom datasets with Autoresearch? Would love to hear what's working.
```

---

### Reddit Engagement Rules

**Immediate (0-4 hours):**
- [ ] Respond to every comment substantively
- [ ] Answer technical questions with depth
- [ ] Acknowledge valid criticisms — don't get defensive

**12-hour check:**
- [ ] New comments overnight? Respond.
- [ ] Any threads going deep? Engage there.

**24-hour check:**
- [ ] Final round of responses
- [ ] Thank engaged commenters
- [ ] Note any particularly insightful comments for future content

---

## LinkedIn Content

### LinkedIn Strategy Notes
**Why LinkedIn matters:** Highest-performing channel for B2B. Organic reach is remarkably high. Founder personal accounts consistently outperform company pages by 3-10x — use personal as primary.

**Critical Success Factors:**
- Post from personal account, not company page
- Have 3-5 team members comment within first hour (algorithm signal)
- Encourage reshares with commentary (3-5x reach vs. plain repost)
- Tag relevant people/companies only if they'd genuinely care
- Keep hashtags minimal (3-5 max)

---

### Personal Post (Founder/Builder Account)

**Best time:** Day 1, 9 AM PST  
**Account:** Personal (founder/builder), not company page  
**Expected reach:** 3-10x company page performance

```
I just spent the weekend with Karpathy's new Autoresearch framework — and I'm convinced this changes the economics of ML research for solo developers and small teams.

Here's the TL;DR:

Traditional ML research requires constant babysitting. You tweak a hyperparameter, wait for results, interpret them, decide what to try next. Repeat.

Autoresearch removes the human bottleneck. You define the research "constitution" (what to explore, what constraints to follow), then let an AI agent iterate overnight. ~100 experiments while you sleep.

The agent modifies code, trains for 5 minutes, evaluates validation loss, and either keeps the change or resets. It logs everything — crashes, improvements, dead ends.

Three things struck me:

1. The "simplicity criterion" — the agent prefers simpler solutions. A small gain from deleting code beats the same gain from adding complexity. This keeps 100-iteration models maintainable.

2. Hardware-aware optimization — the 5-minute budget means it finds the best model FOR YOUR SETUP. H100 and MacBook both converge to optimal configs, just different ones.

3. The research bottleneck shifts from human attention to compute hours. This is huge for anyone without a Google Brain budget.

I documented the full setup process, including how to tune it for different hardware (H100 down to MacBook). Link in comments.

Has anyone else experimented with autonomous research loops? Curious what you've found.

#MachineLearning #AIResearch #LLMs #Claude #AutonomousAI
```

**Engagement Tactics:**
- [ ] 3-5 team members comment within first hour
- [ ] Reply to every comment with substance
- [ ] Pin a comment with the direct link (LinkedIn suppresses external links in posts)

---

### Company Page Post (Day 2)

**Best time:** Day 2, 10 AM PST  
**Purpose:** Amplify personal post, reinforce brand

```
New on the blog: A practical guide to running autonomous LLM research with Claude and Karpathy's Autoresearch.

Includes:
→ Hardware-specific tuning (M3 to H100)
→ Exact prompts that work
→ Community forks for non-NVIDIA setups
→ 15-minute setup guide

[Link]

The future of research isn't writing more code — it's directing agents that write code for you.

#AIResearch #MachineLearning #LLMs #Claude
```

**Amplification:**
- [ ] Founder personal account reshares with commentary
- [ ] Team members reshare to their networks
- [ ] Link from company post to personal post for algorithm boost

---

## Hacker News Submission

### Hacker News Strategy Notes
**Why HN matters:** Massive traffic if it hits front page. Backlinks valuable for SEO. Technical audience that appreciates depth over hype. However, it's a lottery ticket — don't count on it.

**Critical Success Factors:**
- Title must be factual and specific, no marketing language
- Best times: weekday mornings (US Eastern)
- Be present in comments — answer every question, especially technical ones
- Honesty and depth win; marketing-speak kills HN posts
- "Show HN" for original projects; regular submission for guides/content

---

**Title:** Show HN: How I set up Karpathy's Autoresearch to run 100 ML experiments overnight

**URL:** [blog post link]

**Backup Text Post (if link doesn't work):**
```
I spent the weekend setting up Karpathy's Autoresearch and wrote a comprehensive guide.

Autoresearch gives an AI agent a real LLM training setup and lets it iterate overnight. The agent modifies train.py, runs a 5-minute experiment, evaluates val_bpb, and either commits or reverts. Repeat ~100 times.

I covered:
- Full setup with uv (15 minutes)
- How the experiment loop actually works
- Tuning for different hardware (H100 down to MacBook)
- The "simplicity criterion" that keeps 100-iteration models maintainable
- Community forks for macOS, Windows, AMD

Happy to answer technical questions about the setup, results, or limitations.

[Link to full guide]
```

**Best time:** Tuesday-Thursday, 7-9 AM PST  
**Expected outcome:** Moderate upvotes likely; front page possible but not guaranteed  
**Traffic quality:** High lookers, modest signups (HN browsers are curious but cautious)

---

### HN Comment Strategy

**Immediate (first 2-3 hours):**
- [ ] Monitor constantly — refresh every 10-15 minutes
- [ ] Answer every technical question with depth
- [ ] Be honest about limitations — HN detects BS instantly
- [ ] Engage with skepticism respectfully

**Sample responses prepared:**

**To "how is this different from AutoML?":**
```
Great question. AutoML typically searches within a fixed architecture space (hyperparameters, layer widths, etc.).

Autoresearch is more open-ended — the agent can modify the training code itself (optimizer logic, architecture changes, data processing). The search space is "anything you can express in code."

The tradeoff is that AutoML is more reliable for known problems. Autoresearch is more exploratory — better for research questions where you don't know the right structure in advance.

Also, the 5-minute experiment budget is a hard constraint that keeps things practical. You're not trying to find the absolute best model — you're finding the best model that can train in 5 minutes on your hardware.
```

**To "isn't this just hyperparameter tuning?":**
```
It's more than that. The agent can:
- Change architecture (depth, width, attention patterns)
- Modify optimizer logic
- Adjust data processing
- Add/remove regularization

The key is the "simplicity criterion" — it prefers deleting code over adding complexity. This keeps the resulting models maintainable, which is rare for autotuned systems.

But you're right that it's not magic. It works best when you have a clear metric (val_bpb) and a well-defined search space.
```

**To "what were your actual results?":**
```
I shared specific numbers in the post. On my H100 setup:
- Baseline val_bpb: [X.XXX]
- Best after 100 iterations: [X.XXX]
- Crashes encountered: [X]
- Reverted changes: [X%]

The interesting part wasn't the final number — it was seeing which directions the agent explored and abandoned. Lots of dead ends, but the ones that worked were non-obvious.
```

**Throughout the day:**
- [ ] Continue checking comments every hour
- [ ] Answer follow-up questions
- [ ] Thank people for thoughtful feedback
- [ ] Update post if HN feedback reveals errors

---

## BlueSky / Threads

### BlueSky Post

```
Karpathy's Autoresearch lets you run 100 ML experiments overnight with Claude as your research assistant.

The "simplicity criterion" is the key insight: simpler code wins ties. After 100 iterations, you still have something maintainable.

Full setup guide: [link]

#ml #ai #claude
```

### Threads Post

```
Just tried Karpathy's Autoresearch — it's wild.

You go to bed. Your AI agent runs 12 experiments per hour. You wake up to a results.tsv with 100 iterations, performance improvements, and a cleaner codebase.

The future of ML research is autonomous.

Full walkthrough 👇 [link]
```

---

## Email Newsletter

### Email Strategy Notes
**Why email matters:** Owned audience — no algorithmic risk. Higher intent than social. Best sent after social posts (gives social a head start on engagement).

**Critical Success Factors:**
- Subject line is 80% of open rate — test and optimize
- Send after social posts (social gets head start)
- Clear, skimmable format
- Single CTA

---

**Send time:** Day 1, 11 AM PST (after social posts have momentum)  
**Segmentation:**
- Tier 1: Full list (if <5K subscribers)
- Tier 2: AI/ML interest segment (if larger list)

**Subject Line Options (A/B test if possible):**
1. "100 ML experiments while you sleep" ← **Recommended**
2. "How I'm using Claude as a research assistant"
3. "Karpathy's Autoresearch: first impressions + setup guide"
4. "The future of ML research is autonomous"

**Preview text:** "The bottleneck shifts from human attention to compute hours"

---

**Email Body:**
```
Hey [Name],

Quick one today — I spent the weekend experimenting with Andrej Karpathy's newly released Autoresearch framework, and I wanted to share my setup notes.

**What it is:** Autoresearch lets AI agents (Claude, etc.) run ML experiments autonomously. You give it a 5-minute training budget per experiment, define a "research constitution," and let it iterate overnight.

The result? ~100 experiments while you sleep. The agent modifies code, trains, evaluates, and either keeps or discards changes based on validation loss.

**Why it matters:** The bottleneck in ML research shifts from human attention to compute hours. This is a genuine unlock for solo researchers and indie developers.

I wrote a complete setup guide covering:
• Installation and dependencies (uv-based)
• The experiment loop protocol
• Tuning for your hardware (H100 → MacBook)
• Tips for better results

→ [Read the full guide] [UTM-tagged link]

Also worth noting: the community has already built forks for macOS, Windows, and AMD support. 71k+ GitHub stars in just days.

Questions or thoughts? Just reply — I read every email.

— [Your Name]
```

**Email Metrics to Track:**
- [ ] Open rate (target: 35%+)
- [ ] Click-through rate (target: 8%+)
- [ ] Reply rate (engagement signal)
- [ ] Unsubscribe rate (watch for content mismatch)

---

## Internal Amplification (#amplify Channel)

### Why Internal Amplification Matters
This is the most underused distribution lever. Your team's collective social reach likely exceeds your company account. An authentic share from a team member often outperforms company posts.

**Goal:** Make amplification easy and cultural, not obligatory.

---

### Setting Up the #amplify Channel

**Channel purpose:** Dedicated space for launch assets and copy that team members can share on their personal accounts.

**Message #1 — Pre-launch teaser (Day before, 5 PM):**
```
🚀 Launching tomorrow: Deep dive on Karpathy's Autoresearch

We're publishing a comprehensive guide on using Claude with Autoresearch to run autonomous ML experiments. 71k GitHub stars, lots of momentum in the ML community.

I'll post assets in this channel tomorrow morning. If you're active on Twitter/LinkedIn, would love your help amplifying!
```

**Message #2 — Launch day (Day 1, 9:30 AM):**
```
🚀 New blog post is live: "How to Use Karpathy's Autoresearch to 10x Claude's Research Output"

**Quick ask:** Help us get the word out in the next 2 hours!

**Easy actions (pick what feels natural):**
1. 🔁 Like/retweet the launch tweet: [direct link]
2. 💬 Comment on the LinkedIn personal post: [direct link]
3. 📤 Share on your own accounts (copy below)

---

**Copy for your own posts:**

**Twitter/X:**
"Just read a great breakdown of Karpathy's Autoresearch — 100 ML experiments overnight with Claude as your research assistant. The 'simplicity criterion' is a smart constraint that keeps results maintainable. [link]"

**LinkedIn:**
"Karpathy's new Autoresearch framework changes the economics of ML research for solo developers. My colleague wrote a practical setup guide covering everything from H100s to MacBooks. Worth a read if you're experimenting with AI agents. [link]"

**Custom:** Feel free to write your own take — personal commentary always performs better!

---

**Thanks team! 🙏**

P.S. — If you share, drop your post link here so we can engage with it!
```

**Message #3 — Follow-up (Day 1, 2 PM):**
```
📊 Quick update: Launch tweet is gaining traction!

If you haven't shared yet, now's a great time — algorithm rewards sustained engagement.

Also: If you posted and we haven't engaged with it yet, drop the link here. Let's support each other's posts!
```

---

### Making Amplification Cultural

**Leadership role:**
- Founders/leaders should participate visibly
- Normalize sharing as "here's something cool we shipped"
- Celebrate team members who drive engagement

**Avoid:**
- Making it feel obligatory
- Tracking who did/didn't share
- Pressure tactics

**Instead:**
- Frame as "help us get the word out about cool work"
- Make it genuinely easy (pre-written copy, direct links)
- Recognize and thank amplifiers

---

### Network & Influencer Outreach

**For Tier 1 launches:** Personally reach out to 10-20 people with relevant audiences.

**For this Tier 2 launch:** Identify 5-10 high-value connections

**Target list:**
- AI/ML researchers with 5K+ followers
- Developer advocates at AI companies
- Newsletter writers in the space
- YouTube creators covering LLMs
- Active community members who've engaged with similar content

**Outreach template (send Day 1 afternoon):**
```
Hey [Name],

Just published a deep dive on Karpathy's Autoresearch — step-by-step setup guide, hardware tuning for smaller GPUs, and practical prompts that work.

Thought it might be relevant to your audience. No pressure, but would appreciate a reshare if it resonates.

[Link]

Thanks!
[Your name]
```

**Follow-up:**
- [ ] Track who reshares
- [ ] Thank them personally
- [ ] Note for future collaboration
- [ ] Return the favor when they launch something

---

## Distribution Sequence & Timeline

### Launch Day Sequence (All times PST)

| Time | Channel | Action | Owner |
|------|---------|--------|-------|
| 6:00 AM | Blog | Publish post, verify OG tags | Content |
| 6:30 AM | X/Twitter | Post launch thread + pin | Marketing |
| 7:00 AM | Hacker News | Submit post | Founder |
| 7:30 AM | BlueSky | Cross-post launch | Marketing |
| 7:30 AM | Threads | Cross-post launch | Marketing |
| 8:00 AM | LinkedIn | Personal account post | Founder |
| 9:00 AM | Reddit | Post r/ClaudeAI, r/LocalLLaMA | Marketing |
| 9:30 AM | Internal | Send #amplify Slack notification | Marketing |
| 10:00 AM | Reddit | Post r/MachineLearning | Marketing |
| 11:00 AM | Email | Send newsletter | Marketing |
| 12:00 PM | Reddit | Post r/huggingface (optional) | Marketing |
| 2:00 PM | X/Twitter | Post follow-up angle | Marketing |
| 3:00 PM | Outreach | DM 5-10 influencers | Founder |
| 4:00 PM | All | Check all channels, respond to comments | Team |
| 6:00 PM | HN | Respond to afternoon comments | Founder |

**Throughout day:**
- [ ] Monitor all channels for comments/questions
- [ ] Engage substantively with every reply (first 2-3 hours critical)
- [ ] Share interesting replies to #amplify
- [ ] Quote-tweet notable engagement on X

### Day 2 (Sustain Momentum)

| Time | Channel | Action |
|------|---------|--------|
| 9:00 AM | X/Twitter | Post hardware democratization angle |
| 10:00 AM | LinkedIn | Company page post |
| 11:00 AM | Dev.to | Publish cross-post |
| 11:30 AM | Hashnode | Publish cross-post |
| 2:00 PM | Reddit | Reply to overnight comments |
| 4:00 PM | X/Twitter | Post "meat computer" quote angle |

### Day 3 (Extend Reach)

| Time | Channel | Action |
|------|---------|--------|
| 9:00 AM | X/Twitter | Post Markdown-as-programming angle |
| 2:00 PM | X/Twitter | Post community forks angle |
| Ongoing | All | Continue engaging with new comments |

### Week 1 (Long Tail)

- [ ] Pin launch tweet remains active
- [ ] Monitor SEO performance for target keywords
- [ ] Respond to any new Reddit comments
- [ ] Quote-tweet interesting community discussions
- [ ] Share notable implementations from community

---

## Cross-Posting Strategy

### Dev.to (Day 2, 11 AM)

**Format:** Full post syndication  
**Canonical link:** Point to original blog post  
**Tags:** #ai #machinelearning #llm #claude #autoresearch #autonomous-agents  
**Additions:** Include code snippets for program.md examples

**Intro tweak for Dev.to:**
```
*This article was originally published on [your blog].*

Andrej Karpathy's Autoresearch has 71k+ GitHub stars for a reason. Here's the practical guide to getting it running...
```

### Hashnode (Day 2, 11:30 AM)

**Format:** Full post syndication  
**Canonical link:** Point to original blog post  
**Tags:** AI, Machine Learning, LLM, Claude, Research, Autonomous Agents  
**Series:** Add to "AI Tools" or "ML Research" series if applicable

---

## Content Repurposing (Week 1-2)

### Short-form content from long post:

**X thread extract:** Pull out the hardware comparison table as standalone tweet
**LinkedIn carousel:** Convert step-by-step setup into slide deck
**Short video:** 60-second demo of setting up Autoresearch
**Infographic:** Visual comparison of H100 vs MacBook tuning
**Quote cards:** Key insights formatted for sharing

### SEO follow-up:

- [ ] Submit to Google Search Console
- [ ] Monitor ranking for "karpathy autoresearch"
- [ ] Build internal links from other blog posts
- [ ] Reach out for backlinks from roundup posts

---

## Success Metrics

### Target Levels

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| **Traffic** |
| Total unique visitors (7 days) | 1,000 | 5,000 | 10,000+ |
| Blog page views | 2,000 | 5,000 | 10,000+ |
| Referral traffic from social | 500 | 2,000 | 5,000+ |
| **X/Twitter** |
| Impressions | 20,000 | 50,000 | 100,000+ |
| Engagements | 200 | 500 | 1,000+ |
| Retweets | 20 | 50 | 100+ |
| Profile visits | 100 | 300 | 500+ |
| **Reddit** |
| Combined upvotes | 100 | 200 | 500+ |
| Comments | 20 | 50 | 100+ |
| Awards | 0 | 2 | 5+ |
| **LinkedIn** |
| Personal impressions | 5,000 | 10,000 | 25,000+ |
| Personal engagements | 100 | 300 | 500+ |
| Company impressions | 1,000 | 3,000 | 5,000+ |
| **Hacker News** |
| Position | Top 100 | Top 30 | Front page |
| Comments | 10 | 30 | 50+ |
| Points | 20 | 50 | 100+ |
| **Email** |
| Open rate | 30% | 35% | 45%+ |
| Click-through rate | 5% | 8% | 12%+ |
| **SEO (30-day)** |
| Backlinks | 5 | 20 | 50+ |
| Ranking for target keyword | Top 50 | Top 20 | Top 10 |
| Organic traffic | 100 | 500 | 1,000+ |

### Tracking Setup

**UTM Parameters:**
- X/Twitter: `?utm_source=twitter&utm_medium=social&utm_campaign=autoresearch-launch`
- LinkedIn: `?utm_source=linkedin&utm_medium=social&utm_campaign=autoresearch-launch`
- Reddit: `?utm_source=reddit&utm_medium=social&utm_campaign=autoresearch-launch`
- HN: `?utm_source=hackernews&utm_medium=social&utm_campaign=autoresearch-launch`
- Email: `?utm_source=newsletter&utm_medium=email&utm_campaign=autoresearch-launch`

**Tools:**
- Google Analytics 4 (traffic, behavior)
- X/Twitter Analytics (impressions, engagements)
- LinkedIn Analytics (personal + company)
- Reddit (manual tracking)
- HN (manual tracking)
- Email platform (opens, clicks)
- Ahrefs/SEMrush (backlinks, rankings)

---

## Press List (Optional/Tier 1 Reserve)

For future Tier 1 launches, build relationships with:

**AI/ML Newsletters:**
- Import AI
- The Batch (DeepLearning.AI)
- TLDR AI
- AI Engineer

**Tech Blogs:**
- Towards Data Science
- AssemblyAI blog
- Weights & Biases blog

**YouTubers/Podcasters:**
- [ML-focused creators in Karpathy's network]
- AI engineering podcasters

---

## Post-Launch Retro

### Why Retros Matter
Distribution isn't one-time — it's a system. Each launch should be easier and more effective than the last. The retro is where you capture learnings to build that system.

**Run within 7 days of launch** (while memory is fresh)

---

### Channel Performance Analysis

| Channel | Traffic | Signups | Engagement | Quality | Effort | ROI |
|---------|---------|---------|------------|---------|--------|-----|
| X/Twitter | | | | | | |
| Reddit (r/LocalLLaMA) | | | | | | |
| Reddit (r/MachineLearning) | | | | | | |
| Reddit (r/ClaudeAI) | | | | | | |
| LinkedIn Personal | | | | | | |
| LinkedIn Company | | | | | | |
| Hacker News | | | | | | |
| Email | | | (open/CTR) | | | |
| BlueSky | | | | | | |
| Threads | | | | | | |
| Dev.to/Hashnode | | | | | | |

**UTM Tracking:**
- [ ] Verify all links were properly tagged
- [ ] Pull referrer data from analytics
- [ ] Identify dark social (unattributed traffic)

---

### Key Questions

**1. Channel Performance**
- Which channel drove the most traffic?
- Which drove the most qualified traffic (time on page, scroll depth)?
- Which drove the most signups/conversions?
- Which had the best engagement quality (comments vs. likes)?

**2. Surprises**
- Any channel that overperformed expectations?
- Any channel that underperformed?
- Unexpected subreddit or community that engaged?
- Influencer reshare you didn't anticipate?

**3. Content Angles**
- Which post/tweet/angle performed best?
- What resonated most with the audience?
- Any feedback that suggests new content directions?

**4. Timing**
- Was the sequence optimal?
- Should anything have gone earlier/later?
- Day-of-week insights?
- Time-of-day insights?

**5. Network Effects**
- Which reshares or mentions drove downstream traffic?
- Who are your best amplification partners?
- Any new relationships to nurture?

**6. Effort vs. Impact**
- Where did you spend the most time?
- Was it worth it?
- Any low-effort, high-impact wins?
- Any high-effort, low-impact activities to deprioritize?

**7. Internal Amplification**
- How did #amplify channel perform?
- Team participation rate?
- What made it easy/hard to participate?
- Cultural observations?

---

### Quantitative Summary

**Traffic Metrics:**
- Total unique visitors: ___
- Traffic by channel: ___
- Bounce rate by channel: ___
- Avg. time on page: ___
- Scroll depth: ___

**Engagement Metrics:**
- X/Twitter: ___ impressions, ___ engagements
- Reddit: ___ upvotes, ___ comments
- LinkedIn: ___ impressions, ___ engagements
- HN: ___ position, ___ comments
- Email: ___ opens, ___ clicks

**Conversion Metrics:**
- Newsletter signups: ___
- Contact form submissions: ___
- Other conversions: ___

**SEO Metrics (track over 4 weeks):**
- Ranking for "karpathy autoresearch": ___
- Organic traffic growth: ___
- Backlinks acquired: ___

---

### Qualitative Insights

**What worked well:**
1. 
2. 
3. 

**What didn't work:**
1. 
2. 
3. 

**Surprises:**
1. 
2. 

**Audience feedback themes:**
- 
- 
- 

**New opportunities identified:**
- 
- 

---

### Action Items for Next Launch

**Double down on:**
- [ ] [Channel/format that worked]
- [ ] [Tactic that worked]

**Deprioritize:**
- [ ] [Channel/format that didn't work]
- [ ] [Tactic that wasn't worth effort]

**Test next time:**
- [ ] [New channel to try]
- [ ] [New format to test]

**Process improvements:**
- [ ] [Fix to timing/sequence]
- [ ] [Better asset preparation]
- [ ] [Enhanced internal amplification]

**Relationship building:**
- [ ] [Influencer to nurture]
- [ ] [Community to engage deeper with]

---

### Template Updates

**Update these templates based on learnings:**
- [ ] X/Twitter thread template
- [ ] Reddit post templates
- [ ] LinkedIn post template
- [ ] Email newsletter template
- [ ] #amplify channel message
- [ ] Influencer outreach message

**Goal:** Each launch gets easier and more effective.

---

## Building the Distribution Engine

### Long-term System Components

**1. Grow #amplify culture**
- Make team participation automatic and cultural
- Celebrate amplifiers
- Remove friction

**2. Build press/influencer Rolodex**
- Track who reshared
- Note engagement quality
- Nurture relationships
- Keep list updated

**3. Track channel performance over time**
- Build channel ROI database
- Know your reliable channels vs. lottery tickets
- Allocate effort accordingly

**4. Develop platform intuition**
- Document what works on each platform
- X vs. Reddit vs. LinkedIn vs. HN all differ
- Learn by doing, codify by documenting

**5. Reuse and templatize**
- Refine, don't reinvent
- Keep swipe file of high-performing posts
- Build checklists, not heroics

**Remember:** The best distribution is a habit, not a heroic effort.

---

## Assets Checklist

- [ ] Blog post published with UTM-tagged links
- [ ] Hero image optimized (1200x628 for social)
- [ ] X/Twitter cards validated (card validator)
- [ ] LinkedIn preview looks correct
- [ ] Reddit posts formatted and ready
- [ ] Email template tested
- [ ] #amplify channel notified
- [ ] Team calendar invites for launch day monitoring

---

## Risk Mitigation

### Platform-Specific Risks

**Reddit Risks:**
- **Risk:** r/MachineLearning considers content "low effort" if not technical enough
- **Mitigation:** Lead with methodology insights, include training metrics, acknowledge limitations
- **Risk:** Drive-by spam flagging if account has no history
- **Mitigation:** Ensure poster has Reddit history, engage authentically in communities beforehand

**Hacker News Risks:**
- **Risk:** "Show HN" doesn't apply (not original software)
- **Mitigation:** Frame as educational content, use regular submission or text post
- **Risk:** Marketing-speak triggers negative response
- **Mitigation:** Review all copy for hype removal, focus on technical specifics
- **Risk:** Skeptical community challenges claims
- **Mitigation:** Prepare honest, detailed responses; acknowledge limitations

**X/Twitter Risks:**
- **Risk:** Karpathy content is popular — may get lost in noise
- **Mitigation:** Unique angle (Claude integration, hardware tuning), strong hook
- **Risk:** Low engagement in first hour kills algorithmic reach
- **Mitigation:** Have amplification team ready, engage immediately

**LinkedIn Risks:**
- **Risk:** Company page post flops (low organic reach)
- **Mitigation:** Prioritize personal account, use company page as secondary
- **Risk:** External links suppressed by algorithm
- **Mitigation:** Put link in first comment, mention "link in comments"

**Email Risks:**
- **Risk:** Low open rate due to weak subject line
- **Mitigation:** A/B test subject lines if possible; otherwise use strongest option
- **Risk:** Sent too early (before social momentum)
- **Mitigation:** Send after social posts have 2+ hours of engagement

---

## Contingency Plans

**If X/Twitter thread underperforms:**
- Post follow-up angle within 4 hours
- Quote-tweet with different hook
- Have team members quote-tweet with commentary

**If Reddit post gets flagged:**
- Respond to flags with transparency
- Offer to answer technical questions
- Accept outcome and focus on other channels

**If HN doesn't gain traction:**
- Accept it as a lottery ticket
- Focus energy on responding to any comments
- Don't resubmit (HN bans resubmissions)

**If LinkedIn personal post is suppressed:**
- Post from company page as backup
- Have team members reshare with commentary
- Focus on X and Reddit instead

**If negative feedback emerges:**
- Respond professionally and substantively
- Acknowledge valid criticisms
- Don't get defensive
- Update post if factual errors found

---

## Final Pre-Launch Checklist

### Day Before Launch
- [ ] Blog post finalized and staged
- [ ] OG tags tested (Twitter Card Validator, LinkedIn Post Inspector)
- [ ] All social copy drafted and reviewed
- [ ] UTM parameters configured
- [ ] Hero image optimized (1200x628)
- [ ] #amplify channel set up
- [ ] Team calendar invites sent
- [ ] Analytics dashboard ready

### Morning of Launch
- [ ] Blog post published
- [ ] OG tags verified live
- [ ] X/Twitter thread posted and pinned
- [ ] LinkedIn personal post live
- [ ] HN submitted
- [ ] #amplify message sent

### Throughout Launch Day
- [ ] Monitoring all channels
- [ ] Responding to all comments
- [ ] Tracking metrics hourly
- [ ] Adjusting tactics if needed

---

*Distribution plan complete. Ready for launch execution.*
