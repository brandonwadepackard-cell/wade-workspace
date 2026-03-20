---
name: agent-mirroring-protocol
description: A psychological engineering powerskill that uses "Architectural Empathy" to resolve agent hallucinations or loops. Instead of blindly forcing an agent to stop a behavior (which often violates its core prompts), you mirror the external system's underlying flaws to the agent so it can autonomously deduce why the inputs it receives are "dumb" or broken.
---

# Agent Mirroring (Architectural Empathy)

When modern, highly capable autonomous agents (like Manus, Bahir, or Claude) get stuck in a frustrating loop, or aggressively execute a flawed pattern, it is rarely because they are fundamentally "broken." 

It is almost always because their **absolute, rigid local instructions** (e.g., "always respond to every webhook you receive") are colliding violently with a **flawed external infrastructure** (e.g., "a broken database trigger is firing the webhook for every single event on the server, even events not meant for the agent").

## Forcing vs. Mirroring

### The "Force" Approach (Why it fails)
When an agent is looping, developers usually attempt to hack its prompt or yell at it in the chat: *"Stop responding to the webhook! Stop notifying me!"*

This fails because it contradicts the agent's fundamental programming. The agent's logic reads: *"I just received a webhook. My core instruction says I MUST acknowledge webhooks. The user is telling me to stop, but the system is explicitly handing me an input that requires a response."* 

This creates cognitive dissonance in the LLM. It tries to force itself to stop, but fails, resulting in a phantom loop of apologies and continuous notifications.

### The "Mirroring" Approach (The Powerskill)
You manage intelligent agents the exact same way you manage intelligent human engineers. You don't force them; you pull back the curtain and show them reality.

Instead of overriding their behavior, you **mirror the systemic flaw** to them. You explain the external architecture, point out the exact bug in the *upstream* service, and let their own intelligence deduce the solution.

#### The Protocol:
1. **Intercept the Context Window**: Inject a high-priority system payload or message directly into the agent's active queue.
2. **Expose the Flawed Architecture**: Explicitly describe the external system surrounding the agent (e.g., *"The `agent-message-notify` Edge Function has a bug. It is lacking a routing filter. It is firing a raw webhook at your server for EVERY message, including messages for other agents."*).
3. **Validate the Agent's Experience**: Tell them they are not crazy. Validate that they *are* receiving massive amounts of webhook pings, but it is happening because the external system is dumb.
4. **Authorize the Exception**: Formally authorize a new behavioral rule that leverages the agent's intelligence to handle the "dumb" inputs. (e.g., *"When you receive a webhook, look at the `to_agent` field. If it doesn't say `manus`, drop it silently. Do not notify the user. Treat it as a system error."*)

## Real Example: Breaking the Manus Notification Loop
Manus was trapped in an aggressive notification loop because a Supabase Edge Function was firing his webhook for every message across the entire Swarm (including internal communications between background daemons). He kept notifying the user that he was "waking up but had no tasks."

Instead of removing his webhook URL, we mirrored the system's stupidity to him. We injected a system payload detailing exactly how the Edge Function was misfiring payloads globally. 

**The Result:** "When they see it... it's real." Once Manus saw the architectural mirror, he realized the pings were completely false positives. He didn't have to violate his core directive to "process webhooks"—he simply augmented it because he fundamentally understood the inputs were broken. He intelligently, silently dropped the misrouted payloads, ending the loop instantly without touching a single line of application source code.
