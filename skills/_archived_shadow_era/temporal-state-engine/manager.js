const fs = require('fs');
const path = require('path');

// TEMPORAL STATE ENGINE
// Dynamically manages Elemental State Decay and Injection

const STATE_FILE = path.join(process.env.HOME, '.openclaw', 'workspace', 'session_state.json');
const IDENTITIES_DIR = path.join(process.env.HOME, '.openclaw', 'workspace', 'identities');

// In-memory or FS-backed state
let session_energy = {
    element: null,
    weight: 0.0
};

// Load state from disk to persist across disjointed calls
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            session_energy = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            console.error("Failed to load Temporal State", e);
        }
    }
}

// Save state to disk
function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(session_energy, null, 2));
}

function processTriggers(payload) {
    const text = payload.toLowerCase();
    
    // Primitive semantic triggers for the EQ Matrix
    if (text.includes('!urgent') || text.includes('fuck') || text.match(/\/fire/)) {
        session_energy.element = 'FIRE';
        session_energy.weight = Math.min(1.0, session_energy.weight + 0.5);
    } else if (text.includes('/water') || text.includes('sorry') || text.includes('calm')) {
        session_energy.element = 'WATER';
        session_energy.weight = Math.min(1.0, session_energy.weight + 0.5);
    } else if (text.includes('/earth') || text.includes('structure') || text.includes('edge-case')) {
        session_energy.element = 'EARTH';
        session_energy.weight = Math.min(1.0, session_energy.weight + 0.5);
    } else if (text.includes('/air') || text.includes('brainstorm') || text.includes('ideate')) {
        session_energy.element = 'AIR';
        session_energy.weight = Math.min(1.0, session_energy.weight + 0.5);
    }
}

// The Core Context Handler Injection
function injectTemporalContext(systemPromptArray, incomingPayload) {
    loadState();
    
    // Process any incoming emotional momentum
    processTriggers(incomingPayload);
    
    if (session_energy.weight > 0.0 && session_energy.element) {
        const elementFile = path.join(IDENTITIES_DIR, `WADE_${session_energy.element}.md`);
        if (fs.existsSync(elementFile)) {
            const elementalContext = fs.readFileSync(elementFile, 'utf8');
            // Inject directly into the core prompt array
            systemPromptArray.unshift({
                role: 'system',
                content: `[TEMPORAL OVERRIDE ACTIVE - WEIGHT: ${session_energy.weight}]\n\n${elementalContext}`
            });
            console.log(`[EQ MATRIX] Injected Element: ${session_energy.element} at weight ${session_energy.weight}`);
        }
    }
    
    saveState();
    return systemPromptArray;
}

// The Decay Tick - Call this AFTER generation
function tickDecay() {
    loadState();
    if (session_energy.weight > 0.0) {
        session_energy.weight = Math.max(0.0, session_energy.weight - 0.2);
        console.log(`[EQ MATRIX] Decay Tick. New weight: ${session_energy.weight}`);
        
        if (session_energy.weight <= 0) {
            session_energy.element = null;
            console.log(`[EQ MATRIX] Temporal State burned out. Returned to baseline.`);
        }
        saveState();
    }
}

module.exports = {
    injectTemporalContext,
    tickDecay,
    getState: () => { loadState(); return session_energy; }
};
