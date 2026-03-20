---
description: How to dynamically inject Elemental Persona Nodes using a Temporal Decay mechanism in OpenClaw.
---

# SKILL: TEMPORAL STATE ENGINE (THE EQ MATRIX)

## PURPOSE
To prevent OpenClaw agents from suffering "Bipolar Prompt Drift" and "Context Bloat." Instead of loading a monolithic `SOUL.md` full of 50 negative constraints, this skill dynamically injects a single, hyper-targeted Elemental Lens (Fire, Water, Air, Earth) driven by user momentum, and decays it algorithmically.

## THEORY OF OPERATION
LLMs possess no object permanence. Their entire identity is defined by the strings passed to them at the exact millisecond of generation. 
If we structure the OpenClaw javascript gateway to manage a "Temporal Cache" session object, we can instruct the LLM to process information strictly through one Element at a time. The cache "weight" mimics human biological adrenaline—it burns out organically if not reinforced, returning the agent to its baseline state.

## THE 4 ELEMENTAL NODES
You must implement these separate files in `~/.openclaw/workspace/identities/`:
1. **WADE_FIRE.md:** Execution, Velocity, Destruction. Zero filler.
2. **WADE_EARTH.md:** Grounded, Systematic, Edge-case architecture. Methodical.
3. **WADE_WATER.md:** Flow, Deflection, Empathy. Softening friction, absorbing intent.
4. **WADE_AIR.md:** Chaos, Lateral Ideation, Networked thought. Brainstorming purely.

## THE IMPLEMENTATION PROTOCOL
Whenever OpenClaw passes a text payload from Telegram/CLI to Grok 4.1:

1. **State Injection:** 
   * Check the state store (e.g., Redis or a global `dict`) for `session_energy`.
   * If `session_energy.weight > 0.0`, read the corresponding `WADE_[ELEMENT].md` file.
   * Inject the contents of that file *directly* into the `system_prompt` array before the context memory payload.

2. **The Decay Tick:**
   * After the response is sent, automatically execute: `session_energy.weight -= 0.2`.
   * If `weight <= 0.0`, delete the state entirely. The agent returns to its `WADE_CORE_HISTORIAN` baseline.

3. **The Trigger Mechanics:**
   * Do NOT use LLM classification to guess the user's emotion (costs latency and is often inaccurate).
   * Use explicit `/fire` commands, or simple Regex triggers (e.g. `!`, `fuck`, `urgent` = FIRE + 0.5). 

## ARCHITECTURAL CONSTRAINTS
* **Bipolar Parsing Matrix:** If a new Element is triggered while another is active (e.g., Water triggered while Fire is 0.4), the higher weight forces eviction. Do not allow the system to concatenate two files together, as providing conflicting instructions causes generative anxiety.

* **Blindness Overide:** To prevent "Daemon Blindness," the system prompt injected MUST include the exact mathematical similarities of the retrieved RAG memory chunks, forcing the model to empirically "know" what it doesn't know.
