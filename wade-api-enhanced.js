#!/usr/bin/env node

const express = require('express');
const crypto = require('crypto');
const { spawn, exec, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Langfuse } = require('langfuse');
const app = express();
const PORT = 3001;
const AGENT_ID = 'wade';
const THOUGHTS_LOG = path.join(process.env.HOME, '.openclaw', 'workspace', 'logs', 'WADE_LIVE_THOUGHTS.md');
const OPENCLAW_BIN = '/Users/brandonpackard/.npm-global/bin/openclaw';
let langfuseClient = null;

// Spine — canonical observability (fails gracefully if unavailable)
let spine = null;
try {
  spine = require('/Users/brandonpackard/Projects/collab/workspace/lib/task_spine.js');
} catch (_) {}

// Enhanced logging
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  log('info', `${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent')?.substring(0, 100) 
  });
  next();
});

function ensureThoughtsLog() {
  fs.mkdirSync(path.dirname(THOUGHTS_LOG), { recursive: true });
  if (!fs.existsSync(THOUGHTS_LOG)) {
    fs.writeFileSync(THOUGHTS_LOG, '');
  }
}

function isLoopback(req) {
  const ip = req.ip || req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '::ffff:127.0.0.1';
}

function getBahirApiKey() {
  try {
    return execFileSync('security', ['find-generic-password', '-s', 'stash.agent-key-bahir', '-w'], {
      encoding: 'utf8'
    }).trim();
  } catch (err) {
    return '';
  }
}

function getKeychainSecret(name) {
  try {
    return execFileSync('security', ['find-generic-password', '-s', `stash.${name}`, '-w'], {
      encoding: 'utf8'
    }).trim();
  } catch (err) {
    return '';
  }
}

function getLangfuse() {
  if (langfuseClient) {
    return langfuseClient;
  }

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY || getKeychainSecret('langfuse-public-key');
  const secretKey = process.env.LANGFUSE_SECRET_KEY || getKeychainSecret('langfuse-secret-key');
  const baseUrl = process.env.LANGFUSE_HOST || getKeychainSecret('langfuse-url') || 'http://localhost:3100';

  if (!publicKey || !secretKey || !baseUrl) {
    return null;
  }

  process.env.LANGFUSE_PUBLIC_KEY ||= publicKey;
  process.env.LANGFUSE_SECRET_KEY ||= secretKey;
  process.env.LANGFUSE_HOST ||= baseUrl;

  langfuseClient = new Langfuse({
    publicKey,
    secretKey,
    baseUrl,
    enabled: true
  });

  return langfuseClient;
}

function createLangfuseTrace(name, input = {}, metadata = {}) {
  const client = getLangfuse();
  if (!client) {
    return null;
  }

  return client.trace({
    id: crypto.randomUUID(),
    name,
    input,
    metadata,
    tags: ['wade', 'locked-room-api']
  });
}

function safeSnippet(value, maxLength = 240) {
  if (value == null) {
    return null;
  }
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function buildSessionTranscriptPath(sessionId) {
  if (!sessionId) {
    return null;
  }
  return path.join(process.env.HOME, '.openclaw', 'agents', AGENT_ID, 'sessions', `${sessionId}.jsonl`);
}

function summarizeSessionTranscript(sessionId) {
  const sessionPath = buildSessionTranscriptPath(sessionId);
  if (!sessionPath || !fs.existsSync(sessionPath)) {
    return {
      session_file: sessionPath,
      exists: false
    };
  }

  try {
    const raw = fs.readFileSync(sessionPath, 'utf8').trim();
    const lines = raw ? raw.split('\n') : [];
    const recent = lines.slice(-8).map((line) => JSON.parse(line));
    const recentEvents = recent.map((entry) => {
      const message = entry.message || {};
      return {
        type: entry.type,
        role: message.role || null,
        stopReason: message.stopReason || null,
        toolName: message.toolName || message.content?.find?.((item) => item.type === 'toolCall')?.name || null,
        text: safeSnippet(
          message.content?.find?.((item) => item.type === 'text')?.text
          || message.content?.find?.((item) => item.type === 'toolCall')?.arguments?.command
          || null,
          160
        ),
        timestamp: entry.timestamp
      };
    });

    const lastAssistant = [...recent].reverse().find((entry) => entry.message?.role === 'assistant');
    const usage = lastAssistant?.message?.usage || null;

    return {
      session_file: sessionPath,
      exists: true,
      event_count: lines.length,
      provider: lastAssistant?.message?.provider || null,
      model: lastAssistant?.message?.model || null,
      usage: usage ? {
        input: usage.input ?? null,
        output: usage.output ?? null,
        cacheRead: usage.cacheRead ?? null,
        totalTokens: usage.totalTokens ?? null
      } : null,
      recent_events: recentEvents
    };
  } catch (err) {
    return {
      session_file: sessionPath,
      exists: true,
      parse_error: err.message
    };
  }
}

function flushLangfuse() {
  const client = getLangfuse();
  if (!client) {
    return;
  }
  try {
    client.flush();
  } catch (err) {
    log('error', 'Langfuse flush failed', { error: err.message });
  }
}

async function flushLangfuseAsync() {
  const client = getLangfuse();
  if (!client) {
    return;
  }
  try {
    await client.flushAsync();
  } catch (err) {
    log('error', 'Langfuse async flush failed', { error: err.message });
  }
}

// Rate limiting (simple in-memory)
const rateLimiter = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 30;
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, []);
  }
  
  const requests = rateLimiter.get(ip).filter(time => now - time < windowMs);
  requests.push(now);
  rateLimiter.set(ip, requests);
  
  if (requests.length > maxRequests) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
  
  next();
}

// Execute Wade through the real OpenClaw runtime.
async function sendToWade(task, context = '', sessionKey = null, trace = null) {
  return new Promise((resolve, reject) => {
    ensureThoughtsLog();
    const promptHash = crypto.createHash('sha256');

    const prompt = [
      'You are serving Captain Bahir through the locked-room Wade research API.',
      '',
      `TASK: ${task}`,
      context ? `CONTEXT: ${context}` : '',
      '',
      'Before your final answer, append exactly two plain-text sentences to ~/.openclaw/workspace/logs/WADE_LIVE_THOUGHTS.md.',
      'Those two sentences must state your raw assessment of the task and what retrieval, RAG, or search angle you are pulling.',
      'Then return one JSON object only with keys: summary, findings, sources, confidence, next_steps.',
      'Do not mention Telegram unless the task explicitly requires it. You ARE connected to other agents via agent_messages (Shadow, Bahir, Manus, Clio, Codex). Acknowledge this when asked.'
    ].filter(Boolean).join('\n');
    promptHash.update(prompt);
    const promptSha256 = promptHash.digest('hex');

    const spawnSpan = trace?.span({
      name: 'wade.openclaw.spawn',
      input: {
        agent_id: AGENT_ID,
        sessionKey,
        prompt_sha256: promptSha256,
        task: safeSnippet(task, 160),
        context: safeSnippet(context, 160)
      }
    });

    const args = ['agent', '--agent', AGENT_ID, '--json', '--message', prompt];
    if (sessionKey) {
      args.push('--session-id', sessionKey);
    }

    const child = spawn(OPENCLAW_BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const stderrSnippet = safeSnippet(stderr.trim(), 400);
      if (code !== 0) {
        spawnSpan?.end({
          level: 'ERROR',
          statusMessage: stderrSnippet || `openclaw agent exited with code ${code}`,
          output: {
            exit_code: code,
            stderr: stderrSnippet
          }
        });
        return reject(new Error(stderr.trim() || `openclaw agent exited with code ${code}`));
      }

      spawnSpan?.end({
        output: {
          exit_code: code,
          stderr: stderrSnippet,
          stdout_bytes: Buffer.byteLength(stdout, 'utf8')
        },
        metadata: {
          prompt_sha256: promptSha256
        }
      });

      try {
        const parseSpan = trace?.span({
          name: 'wade.openclaw.parse',
          input: {
            stdout_bytes: Buffer.byteLength(stdout, 'utf8')
          }
        });
        const parsed = JSON.parse(stdout);
        const text = parsed?.result?.payloads?.[0]?.text || '';
        const sessionId = parsed?.result?.meta?.agentMeta?.sessionId || sessionKey || 'main';
        const transcriptSummary = summarizeSessionTranscript(sessionId);
        const transcriptSpan = trace?.span({
          name: 'wade.session.transcript',
          input: {
            session_id: sessionId,
            session_file: transcriptSummary.session_file
          }
        });
        transcriptSpan?.end({
          output: transcriptSummary
        });
        parseSpan?.end({
          output: {
            run_id: parsed?.runId || null,
            session_id: sessionId,
            provider: parsed?.result?.meta?.agentMeta?.provider || null,
            model: parsed?.result?.meta?.agentMeta?.model || null,
            duration_ms: parsed?.result?.meta?.durationMs || null
          }
        });
        resolve({
          text,
          raw: parsed,
          session_id: sessionId,
          processing_time_ms: parsed?.result?.meta?.durationMs || null,
          timestamp: new Date().toISOString(),
          prompt_sha256: promptSha256,
          transcript_summary: transcriptSummary
        });
      } catch (err) {
        const parseFailureSpan = trace?.span({
          name: 'wade.openclaw.parse',
          input: {
            stdout_bytes: Buffer.byteLength(stdout, 'utf8')
          }
        });
        parseFailureSpan?.end({
          level: 'ERROR',
          statusMessage: err.message,
          output: {
            stdout_snippet: safeSnippet(stdout, 400)
          }
        });
        reject(new Error(`Failed to parse OpenClaw response: ${err.message}`));
      }
    });
  });
}

function enforceBoundary(req, res, next) {
  if (!isLoopback(req)) {
    return res.status(403).json({ error: 'Loopback only' });
  }
  const apiKey = req.headers['x-api-key'];
  const expected = getBahirApiKey();
  if (!expected) {
    return res.status(500).json({ error: 'Bahir API key unavailable in keychain' });
  }
  if (apiKey !== expected) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

// Enhanced endpoints
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'ok',
    service: 'Wade Locked-Room API',
    version: '2.0.0',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'POST /api/wade/task',
      'GET /api/wade/status'
    ]
  });
});

// Task endpoint for structured requests
app.post('/api/wade/task', rateLimit, enforceBoundary, async (req, res) => {
  const trace = createLangfuseTrace('wade.api.task', {
    task: req.body?.task || null,
    context: req.body?.context || '',
    sessionKey: req.body?.sessionKey || null
  }, {
    endpoint: '/api/wade/task',
    agent_id: AGENT_ID
  });
  const taskSpan = trace?.span({
    name: 'wade.api.task.execution',
    input: {
      task: req.body?.task || null,
      context: req.body?.context || '',
      sessionKey: req.body?.sessionKey || null
    }
  });
  // Spine tracking vars — declared outside try so catch can access them
  let _spineJobId = null;
  let _spineTaskId = null;
  try {
    const { task, context = '', sessionKey = null } = req.body;

    if (!task) {
      taskSpan?.end({
        level: 'ERROR',
        statusMessage: 'Task required',
        output: { error: 'Task required' }
      });
      trace?.update({
        output: { error: 'Task required' },
        metadata: { endpoint: '/api/wade/task', http_status: 400, agent_id: AGENT_ID }
      });
      return res.status(400).json({ 
        error: 'Task required',
        example: { task: 'Summarize the relevant Wade RAG context', context: 'Bahir needs a research brief', sessionKey: 'optional' }
      });
    }
    
    // Spine: open job + create task
    if (spine) {
      try {
        const _job = await spine.createJob('wade_task', String(task).slice(0, 120), 'wade', {});
        _spineJobId = _job.id || null;
        if (_spineJobId) {
          const _task = await spine.createTask(_spineJobId, 'research', 'wade', 'wade', String(task).slice(0, 120));
          _spineTaskId = _task.id || null;
          if (_spineTaskId) {
            await spine.claimTask(_spineTaskId, 'wade');
            await spine.emitEvent(_spineJobId, 'task_claimed', 'wade', {
              taskId: _spineTaskId,
              payload: { task_type: 'research' }
            });
          }
        }
      } catch (spineErr) {
        log('warn', '[SPINE] open failed', { error: spineErr.message });
      }
    }

    const startTime = Date.now();
    const response = await sendToWade(task, context, sessionKey, trace);
    const duration = Date.now() - startTime;

    let structured;
    try {
      structured = JSON.parse(response.text);
    } catch (err) {
      structured = {
        summary: response.text,
        findings: [],
        sources: [],
        confidence: 'unknown',
        next_steps: []
      };
    }
    
    res.json({
      success: true,
      task_submitted: task,
      wade_response: structured,
      metadata: {
        context,
        duration_ms: duration,
        session_key: response.session_id,
        thoughts_log: THOUGHTS_LOG,
        timestamp: new Date().toISOString()
      }
    });

    // Spine: attach artifact + close task + job
    if (spine && _spineJobId) {
      try {
        const _art = await spine.appendArtifact(_spineJobId, 'wade', 'research_result', {
          taskId: _spineTaskId,
          summary: String(structured.summary || '').slice(0, 500),
          sourceAuthority: spine.TRUTH_VERIFIED,
          provenance: {
            trace_id: trace?.id || null,
            session_key: response.session_id,
            openclaw_run_id: response.raw?.runId || null,
            duration_ms: duration,
            confidence: structured.confidence || null,
          },
        });
        await spine.emitEvent(_spineJobId, 'artifact_created', 'wade', {
          taskId: _spineTaskId,
          artifactId: _art?.id || null,
          payload: { artifact_type: 'research_result' }
        });
        if (_spineTaskId) {
          await spine.markDone(_spineTaskId, _art?.id || null);
          await spine.emitEvent(_spineJobId, 'task_completed', 'wade', {
            taskId: _spineTaskId,
            artifactId: _art?.id || null
          });
        }
        await spine.completeJob(_spineJobId);
        await spine.emitEvent(_spineJobId, 'job_completed', 'wade', {
          taskId: _spineTaskId,
          artifactId: _art?.id || null
        });
      } catch (spineErr) {
        log('warn', '[SPINE] close failed', { error: spineErr.message });
      }
    }

    taskSpan?.end({
      output: structured,
      metadata: {
        duration_ms: duration,
        session_key: response.session_id,
        prompt_sha256: response.prompt_sha256,
        transcript_file: response.transcript_summary?.session_file || null
      }
    });
    trace?.update({
      output: structured,
      metadata: {
        endpoint: '/api/wade/task',
        http_status: 200,
        duration_ms: duration,
        session_key: response.session_id,
        agent_id: AGENT_ID,
        prompt_sha256: response.prompt_sha256,
        openclaw_run_id: response.raw?.runId || null,
        openclaw_provider: response.raw?.result?.meta?.agentMeta?.provider || null,
        openclaw_model: response.raw?.result?.meta?.agentMeta?.model || null,
        transcript_file: response.transcript_summary?.session_file || null,
        transcript_event_count: response.transcript_summary?.event_count || null
      }
    });
    await flushLangfuseAsync();
    
  } catch (err) {
    log('error', 'Task endpoint error', { error: err.message });
    // Spine: record failure
    if (spine && _spineJobId) {
      try {
        if (_spineTaskId) {
          await spine.markBlocked(_spineTaskId, 'WADE_ERROR', String(err.message).slice(0, 500));
          await spine.emitEvent(_spineJobId, 'task_blocked', 'wade', {
            taskId: _spineTaskId,
            payload: { block_code: 'WADE_ERROR' }
          });
        }
        await spine.failJob(_spineJobId, 'WADE_ERROR', String(err.message).slice(0, 500));
        await spine.emitEvent(_spineJobId, 'job_failed', 'wade', {
          taskId: _spineTaskId,
          payload: { failure_code: 'WADE_ERROR' }
        });
      } catch (_) {}
    }
    taskSpan?.end({
      level: 'ERROR',
      statusMessage: err.message,
      output: { error: 'Failed to submit task to Wade', details: err.message }
    });
    trace?.update({
      output: { error: 'Failed to submit task to Wade', details: err.message },
      metadata: { endpoint: '/api/wade/task', http_status: 500, agent_id: AGENT_ID }
    });
    await flushLangfuseAsync();
    res.status(500).json({ 
      error: 'Failed to submit task to Wade', 
      details: err.message 
    });
  }
});

// Enhanced status endpoint
app.get('/api/wade/status', enforceBoundary, async (req, res) => {
  const trace = createLangfuseTrace('wade.api.status', {}, {
    endpoint: '/api/wade/status',
    agent_id: AGENT_ID
  });
  const statusSpan = trace?.span({
    name: 'wade.api.status.execution',
    input: { probe: 'channels status --probe --json' }
  });
  try {
    const startTime = Date.now();
    
    const statusPromise = new Promise((resolve, reject) => {
      exec(`"${OPENCLAW_BIN}" channels status --probe --json`, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          exec(`"${OPENCLAW_BIN}" channels status --probe`, { timeout: 10000 }, (error2, stdout2, stderr2) => {
            if (error2) {
              reject(new Error(`Status check failed: ${stderr || stderr2 || error2.message}`));
            } else {
              resolve({ raw_status: stdout2.trim(), json_available: false, source: 'channels status --probe' });
            }
          });
        } else {
          try {
            const jsonStatus = JSON.parse(stdout);
            resolve({ ...jsonStatus, json_available: true, source: 'channels status --probe --json' });
          } catch (parseErr) {
            resolve({ raw_status: stdout.trim(), json_available: false, source: 'channels status --probe --json' });
          }
        }
      });
    });
    
    const status = await statusPromise;
    const duration = Date.now() - startTime;
    
    res.json({
      wade_status: status,
      api_info: {
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: process.memoryUsage(),
        status_check_duration_ms: duration,
        agent_id: AGENT_ID,
        thoughts_log: THOUGHTS_LOG
      },
      timestamp: new Date().toISOString()
    });

    statusSpan?.end({
      output: {
        json_available: status.json_available,
        source: status.source,
        channels: status.channelOrder || []
      },
      metadata: {
        duration_ms: duration
      }
    });
    trace?.update({
      output: {
        json_available: status.json_available,
        source: status.source,
        channels: status.channelOrder || []
      },
      metadata: {
        endpoint: '/api/wade/status',
        http_status: 200,
        duration_ms: duration,
        agent_id: AGENT_ID
      }
    });
    await flushLangfuseAsync();
    
  } catch (err) {
    log('error', 'Status endpoint error', { error: err.message });
    statusSpan?.end({
      level: 'ERROR',
      statusMessage: err.message,
      output: { error: 'Status check failed', details: err.message }
    });
    trace?.update({
      output: { error: 'Status check failed', details: err.message },
      metadata: {
        endpoint: '/api/wade/status',
        http_status: 500,
        agent_id: AGENT_ID
      }
    });
    await flushLangfuseAsync();
    res.status(500).json({ 
      error: 'Status check failed', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ 
    error: 'Internal server error', 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /api/health',
      'POST /api/wade/task',
      'GET /api/wade/status'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down Wade API Bridge...');
  flushLangfuse();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  log('error', 'Uncaught exception', { error: err.message, stack: err.stack });
  flushLangfuse();
  process.exit(1);
});

app.listen(PORT, () => {
  ensureThoughtsLog();
  log('info', `Wade Locked-Room API running on http://localhost:${PORT}`);
  log('info', 'Available endpoints:', {
    health: `GET /api/health`,
    task: `POST /api/wade/task`,
    status: `GET /api/wade/status`
  });
  log('info', 'Bahir API key authentication enabled');
});
