require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { RouterOSAPI } = require('node-routeros')
const ws = require('ws')
const express = require('express')
const path = require('path')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
)

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '5000')

// Cache koneksi router aktif
const routerConnections = {}

// UI Logger & Real-time SSE Stream
const maxLogs = 150
const agentLogs = []
const sseClients = new Set()
let totalCommandsCount = 0

function logToUI(type, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type, // 'system', 'success', 'command', 'error', 'info'
    message
  }
  agentLogs.push(logEntry)
  if (agentLogs.length > maxLogs) agentLogs.shift()

  // Console Output
  const prefix = type === 'system' ? '🤖' : type === 'success' ? '✅' : type === 'command' ? '📋' : '❌'
  console.log(`${prefix} ${message}`)

  // Stream to SSE clients
  const sseData = `data: ${JSON.stringify(logEntry)}\n\n`
  for (const client of sseClients) {
    client.write(sseData)
    if (client.flush) {
      client.flush()
    }
  }
}

logToUI('system', 'NuxBill MikroTik Agent starting...')
logToUI('system', `Polling Supabase every ${POLL_INTERVAL}ms`)

async function getRouterConnection(router) {
  // SIMULATION MODE
  if (process.env.SIMULATION_MODE === 'true' || router.ip_address === '127.0.0.1') {
    return {
      write: async (args) => {
        logToUI('command', `[SIMULATION] Executing command: ${JSON.stringify(args)}`)
        if (args[0] && args[0].includes('print')) {
          return [{ '.id': '*SIMULATED' }]
        }
        return { simulated: true }
      },
      connect: async () => true
    }
  }

  const key = `${router.ip_address}:${router.username}`
  if (routerConnections[key]) {
    return routerConnections[key]
  }

  const parts = router.ip_address.split(':')
  const host = parts[0]
  const port = parts[1] ? parseInt(parts[1]) : 8728

  const conn = new RouterOSAPI({
    host,
    port,
    user: router.username,
    password: router.password,
    timeout: 0,
  })

  conn.on('error', (err) => {
    logToUI('error', `Router connection error (${host}): ${err.message}`)
    delete routerConnections[key]
  })
  conn.on('timeout', () => {
    delete routerConnections[key]
    conn.close().catch(() => {})
  })

  await conn.connect()
  routerConnections[key] = conn
  logToUI('success', `Connected to router: ${router.name} (${host})`)
  return conn
}

async function executeCommand(api, command, payload) {
  switch (command) {
    case 'add_hotspot_user': {
      const args = [
        '/ip/hotspot/user/add',
        `=name=${payload.username}`,
        `=password=${payload.password}`,
      ]
      if (payload.profile) args.push(`=profile=${payload.profile}`)
      if (payload.comment) args.push(`=comment=${payload.comment}`)
      if (payload.limit_uptime) args.push(`=limit-uptime=${payload.limit_uptime}`)
      if (payload.limit_bytes_total) args.push(`=limit-bytes-total=${payload.limit_bytes_total}`)
      return await api.write(args)
    }

    case 'remove_hotspot_user': {
      // Cari user dulu
      const users = await api.write([
        '/ip/hotspot/user/print',
        `?name=${payload.username}`,
      ])
      if (users && users.length > 0) {
        await api.write(['/ip/hotspot/user/remove', `=.id=${users[0]['.id']}`])
      }
      return { removed: true }
    }

    case 'add_pppoe_secret': {
      const args = [
        '/ppp/secret/add',
        `=name=${payload.username}`,
        `=password=${payload.password}`,
        `=service=pppoe`,
      ]
      if (payload.profile) args.push(`=profile=${payload.profile}`)
      if (payload.local_address) args.push(`=local-address=${payload.local_address}`)
      if (payload.remote_address) args.push(`=remote-address=${payload.remote_address}`)
      if (payload.comment) args.push(`=comment=${payload.comment}`)
      return await api.write(args)
    }

    case 'remove_pppoe_secret': {
      const secrets = await api.write([
        '/ppp/secret/print',
        `?name=${payload.username}`,
      ])
      if (secrets && secrets.length > 0) {
        await api.write(['/ppp/secret/remove', `=.id=${secrets[0]['.id']}`])
      }
      return { removed: true }
    }

    case 'disable_pppoe_secret': {
      const secrets = await api.write([
        '/ppp/secret/print',
        `?name=${payload.username}`,
      ])
      if (secrets && secrets.length > 0) {
        const setArgs = ['/ppp/secret/set', `=.id=${secrets[0]['.id']}`, '=disabled=yes'];
        if (payload.comment) setArgs.push(`=comment=${payload.comment}`);
        await api.write(setArgs);
        
        const active = await api.write([
          '/ppp/active/print',
          `?name=${payload.username}`,
        ])
        for (const session of active || []) {
          await api.write(['/ppp/active/remove', `=.id=${session['.id']}`])
        }
      }
      return { disabled: true }
    }

    case 'enable_pppoe_secret': {
      const secrets = await api.write([
        '/ppp/secret/print',
        `?name=${payload.username}`,
      ])
      if (secrets && secrets.length > 0) {
        const setArgs = ['/ppp/secret/set', `=.id=${secrets[0]['.id']}`, '=disabled=no']
        if (payload.comment) setArgs.push(`=comment=${payload.comment}`)
        await api.write(setArgs)
      }
      return { enabled: true }
    }

    case 'update_pppoe_secret': {
      const secrets = await api.write(['/ppp/secret/print', `?name=${payload.username}`])
      if (secrets && secrets.length > 0) {
        const setArgs = ['/ppp/secret/set', `=.id=${secrets[0]['.id']}`]
        if (payload.password) setArgs.push(`=password=${payload.password}`)
        if (payload.profile) setArgs.push(`=profile=${payload.profile}`)
        await api.write(setArgs)
      }
      return { updated: true }
    }

    case 'kick_pppoe_user': {
      const active = await api.write(['/ppp/active/print', `?name=${payload.username}`])
      for (const session of active || []) {
        await api.write(['/ppp/active/remove', `=.id=${session['.id']}`])
      }
      return { kicked: true }
    }

    case 'disable_hotspot_user': {
      const users = await api.write(['/ip/hotspot/user/print', `?name=${payload.username}`])
      if (users && users.length > 0) {
        const setArgs = ['/ip/hotspot/user/set', `=.id=${users[0]['.id']}`, '=disabled=yes']
        if (payload.comment) setArgs.push(`=comment=${payload.comment}`)
        await api.write(setArgs)
        
        const active = await api.write(['/ip/hotspot/active/print', `?user=${payload.username}`])
        for (const session of active || []) {
          await api.write(['/ip/hotspot/active/remove', `=.id=${session['.id']}`])
        }
      }
      return { disabled: true }
    }

    case 'enable_hotspot_user': {
      const users = await api.write(['/ip/hotspot/user/print', `?name=${payload.username}`])
      if (users && users.length > 0) {
        const setArgs = ['/ip/hotspot/user/set', `=.id=${users[0]['.id']}`, '=disabled=no']
        if (payload.comment) setArgs.push(`=comment=${payload.comment}`)
        await api.write(setArgs)
      }
      return { enabled: true }
    }

    case 'update_hotspot_user': {
      const users = await api.write(['/ip/hotspot/user/print', `?name=${payload.username}`])
      if (users && users.length > 0) {
        const setArgs = ['/ip/hotspot/user/set', `=.id=${users[0]['.id']}`]
        if (payload.password) setArgs.push(`=password=${payload.password}`)
        if (payload.profile) setArgs.push(`=profile=${payload.profile}`)
        await api.write(setArgs)
      }
      return { updated: true }
    }

    case 'sync_mikrotik_profile': {
      if (payload.type === 'Hotspot') {
        const profiles = await api.write(['/ip/hotspot/user/profile/print', `?name=${payload.name}`])
        const args = [
          (profiles && profiles.length > 0) ? '/ip/hotspot/user/profile/set' : '/ip/hotspot/user/profile/add',
          ...(profiles && profiles.length > 0 ? [`=.id=${profiles[0]['.id']}`] : [`=name=${payload.name}`]),
          `=rate-limit=${payload.rate_limit || ''}`,
          '=status-autorefresh=1m',
          '=shared-users=1'
        ]
        await api.write(args)
      } else if (payload.type === 'PPPOE') {
        const profiles = await api.write(['/ppp/profile/print', `?name=${payload.name}`])
        const args = [
          (profiles && profiles.length > 0) ? '/ppp/profile/set' : '/ppp/profile/add',
          ...(profiles && profiles.length > 0 ? [`=.id=${profiles[0]['.id']}`] : [`=name=${payload.name}`]),
          `=rate-limit=${payload.rate_limit || ''}`
        ]
        await api.write(args)
      }
      return { synced: true }
    }

    case 'kick_hotspot_user':
    case 'disconnect_hotspot_user': {
      const active = await api.write([
        '/ip/hotspot/active/print',
        `?user=${payload.username}`,
      ])
      for (const session of active || []) {
        await api.write(['/ip/hotspot/active/remove', `=.id=${session['.id']}`])
      }
      return { disconnected: true }
    }

    case 'get_router_info': {
      const identity = await api.write(['/system/identity/print'])
      const resources = await api.write(['/system/resource/print'])
      return { identity: identity?.[0], resources: resources?.[0] }
    }

    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

async function processCommands() {
  try {
    // Ambil semua pending commands
    const { data: commands, error } = await supabase
      .from('mikrotik_command_queue')
      .select('*, routers(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      logToUI('error', `Supabase error: ${error.message}`)
      return
    }

    if (!commands || commands.length === 0) return

    logToUI('system', `Processing ${commands.length} command(s)...`)

    for (const cmd of commands) {
      // Mark as processing
      await supabase
        .from('mikrotik_command_queue')
        .update({ status: 'processing' })
        .eq('id', cmd.id)

      try {
        const router = cmd.routers
        if (!router) throw new Error('Router not found')

        const api = await getRouterConnection(router)
        const result = await executeCommand(api, cmd.command, cmd.payload)

        // Mark as done
        await supabase
          .from('mikrotik_command_queue')
          .update({
            status: 'done',
            result: result,
            processed_at: new Date().toISOString(),
          })
          .eq('id', cmd.id)

        totalCommandsCount++
        logToUI('success', `Command done: [${cmd.command}] for router ${router.name}`)

        // Update router last_seen + status Online
        await supabase
          .from('routers')
          .update({ last_seen: new Date().toISOString(), status: 'Online' })
          .eq('id', router.id)

      } catch (err) {
        logToUI('error', `Command failed [${cmd.command}]: ${err.message}`)

        // Mark as error
        await supabase
          .from('mikrotik_command_queue')
          .update({
            status: 'error',
            error_message: err.message,
            processed_at: new Date().toISOString(),
          })
          .eq('id', cmd.id)

        // Clear cached connection on error
        if (cmd.routers) {
          const key = `${cmd.routers.ip_address}:${cmd.routers.username}`
          delete routerConnections[key]
        }
      }
    }
  } catch (err) {
    logToUI('error', `Poll error: ${err.message}`)
  }
}

// Start Polling
logToUI('system', 'Agent running! Waiting for commands...')
setInterval(processCommands, POLL_INTERVAL)
processCommands() // Run immediately on start

// --- BACKGROUND HEARTBEAT (Every 60 seconds) ---
async function runHeartbeat() {
  try {
    const { data: allRouters } = await supabase.from('routers').select('id')
    if (allRouters) {
      for (const r of allRouters) {
        await supabase
          .from('routers')
          .update({ last_seen: new Date().toISOString(), status: 'Online' })
          .eq('id', r.id)
      }
    }
  } catch (err) {
    // Fail silently in background
  }
}
setInterval(runHeartbeat, 60000)
runHeartbeat() // Run once on startup

// --- SUPABASE REALTIME (Blazing-Fast instant command executor) ---
supabase
  .channel('public:mikrotik_command_queue')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'mikrotik_command_queue',
      filter: 'status=eq.pending'
    },
    (payload) => {
      logToUI('system', '⚡ [REALTIME] Perintah baru terdeteksi! Memproses...')
      processCommands()
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logToUI('system', '📡 Supabase Realtime Aktif! Mendengar perintah instan (0ms delay)...')
    }
  })

// ── EXPRESS SERVER & DASHBOARD API ──
const app = express()
const PORT = process.env.AGENT_PORT || 3002

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// GET /api/status - Returns active stats and router connections
app.get('/api/status', async (req, res) => {
  try {
    const { data: routers } = await supabase.from('routers').select('*')
    const activeKeys = Object.keys(routerConnections)
    
    // Count vouchers created today since midnight
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const { count: todayVouchersCount } = await supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString())
    
    const stats = {
      uptime: Math.floor(process.uptime()),
      memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      totalCommands: totalCommandsCount,
      pollInterval: POLL_INTERVAL,
      todayVouchers: todayVouchersCount || 0
    }
    
    res.json({
      routers: routers || [],
      cachedConnections: activeKeys,
      stats
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/logs - Returns all past logs
app.get('/api/logs', (req, res) => {
  res.json(agentLogs)
})

// GET /api/logs/stream - Server-Sent Events stream for real-time console updates
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  sseClients.add(res)

  req.on('close', () => {
    sseClients.delete(res)
  })
})

// Keep SSE connections active with a 15-second heartbeat
setInterval(() => {
  for (const client of sseClients) {
    client.write(': keep-alive\n\n')
    if (client.flush) {
      client.flush()
    }
  }
}, 15000)

// POST /api/test-connection - Test MikroTik connection on demand
app.post('/api/test-connection', async (req, res) => {
  const { id } = req.body
  try {
    const { data: router, error } = await supabase
      .from('routers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !router) {
      return res.status(404).json({ success: false, message: 'Router tidak ditemui' })
    }

    logToUI('system', `🧪 Memulakan ujian sambungan ke router: ${router.name} (${router.ip_address})`)
    
    const startTime = Date.now()
    const api = await getRouterConnection(router)
    
    // Ping dengan melakukan pembacaan identitas mikroTik
    await api.write(['/system/identity/print'])
    
    const latency = Date.now() - startTime
    
    logToUI('success', `✅ Ujian sambungan berjaya untuk ${router.name}! Latensi: ${latency}ms`)
    res.json({ success: true, latency })
  } catch (err) {
    logToUI('error', `❌ Ujian sambungan gagal untuk router ID ${id}: ${err.message}`)
    res.status(500).json({ success: false, message: err.message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  logToUI('success', `Dashboard UI available at: http://localhost:${PORT}`)
})
