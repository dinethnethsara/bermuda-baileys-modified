# 🌴 Baileys - BERMUDA Cyber Family Edition

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0--bermuda-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)

**Enhanced WhatsApp Web Library with Advanced Features**

*Modified and Enhanced by BERMUDA Cyber Family*

---

### 🔥 Features | 🚀 Performance | 🛡️ Stability

</div>

## 📖 Table of Contents

- [About](#about)
- [What's New](#whats-new)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Enhanced Features](#enhanced-features)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Configuration](#configuration)
- [Credits](#credits)
- [License](#license)

---

## 🎯 About

**@bermuda/baileys-modified** is an enhanced version of the popular [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) library. It maintains 100% backward compatibility while adding powerful new features designed for production environments and bot developers who need reliability, stability, and advanced control.

### Why BERMUDA Edition?

- ✨ **Production-Ready**: Built-in features to prevent bans and handle edge cases
- 🎨 **Beautiful Interface**: Rainbow gradient banner and colorful logging
- 🔄 **Auto-Reconnect**: Intelligent reconnection with exponential backoff
- 🛡️ **Rate Limiting**: Prevents WhatsApp bans with smart request throttling
- 📊 **Health Monitoring**: Real-time connection health tracking
- 🎣 **Hooks & Middleware**: Extend functionality with custom logic
- 📦 **Message Queue**: Reliable message delivery with automatic retries
- 🖼️ **Enhanced Media**: Improved media handling with retry mechanisms

---

## 🆕 What's New

### BERMUDA Enhancements Over Original Baileys:

#### 🎨 **Visual Improvements**
- Rainbow gradient startup banner
- Colorful console logging with status indicators
- Progress tracking for uploads/downloads

#### 🔄 **Connection Management**
- **Auto-Reconnect System**: Exponential backoff algorithm (1s → 60s max)
- **Connection Health Monitor**: Tracks uptime, disconnections, and message counts
- **Session Restoration**: Automatic session recovery on disconnection

#### 🛡️ **Anti-Ban Protection**
- **Rate Limiter**: Configurable request throttling (default: 20 req/10s)
- **Message Queue**: Smart message delivery with priority system
- **Retry Mechanisms**: Automatic retry on failures (configurable attempts)

#### 🎣 **Developer Tools**
- **Lifecycle Hooks**: `onBeforeConnect`, `onAfterConnect`, `onBeforeDisconnect`, `onAfterDisconnect`
- **Message Hooks**: `onMessageReceive`, `onMessageSend`
- **Middleware System**: Chain processing functions for messages
- **Plugin Architecture**: Easy extensibility

#### 📦 **Enhanced Media**
- Automatic retry on upload/download failures
- Progress tracking callbacks
- Timeout handling (default: 30s)
- Better error messages

#### 📊 **Monitoring & Logging**
- Advanced logger with levels (trace, debug, info, warn, error, fatal)
- Colorized console output
- Integration with Pino logger
- Health check intervals

---

## 📦 Installation

### Using npm:
```bash
npm install @bermuda/baileys-modified
```

### Using yarn:
```bash
yarn add @bermuda/baileys-modified
```

### Using pnpm:
```bash
pnpm add @bermuda/baileys-modified
```

### Requirements:
- **Node.js**: >= 20.0.0
- **Optional**: `sharp` for image processing, `jimp` for image manipulation

---

## 🚀 Quick Start

### Basic Usage (Same as Original Baileys)

```typescript
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@bermuda/baileys-modified'

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })
    
    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting:', shouldReconnect)
            
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('Connected successfully!')
        }
    })
    
    sock.ev.on('messages.upsert', async (m) => {
        console.log('New message:', JSON.stringify(m, undefined, 2))
        
        const msg = m.messages[0]
        if(!msg.key.fromMe && m.type === 'notify') {
            await sock.sendMessage(msg.key.remoteJid!, { 
                text: 'Hello from BERMUDA Baileys!' 
            })
        }
    })
}

connectToWhatsApp()
```

**🎨 Output**: When you run this, you'll see the beautiful BERMUDA rainbow gradient banner!

---

## 🎯 Enhanced Features

### 1. Rate Limiting (Prevent WhatsApp Bans)

```typescript
import makeWASocket, { RateLimiter } from '@bermuda/baileys-modified'

const sock = makeWASocket({ /* config */ })
const rateLimiter = new RateLimiter({
    maxRequests: 20,        // Max requests
    timeWindow: 10000,      // Per 10 seconds
    enableWarnings: true    // Show warnings
}, sock.logger)

// Use before sending messages
await rateLimiter.acquire()
await sock.sendMessage(jid, { text: 'Hello!' })
```

**How it works**:
- Tracks requests in a sliding time window
- Automatically delays requests if limit is reached
- Prevents WhatsApp from flagging your number

---

### 2. Message Queue System

```typescript
import { MessageQueue } from '@bermuda/baileys-modified'

const messageQueue = new MessageQueue({
    maxRetries: 3,          // Retry failed messages 3 times
    retryDelay: 1000,       // Wait 1s between retries
    maxQueueSize: 100,      // Maximum queue size
    enableLogs: true        // Show queue logs
}, sock.logger)

// Add messages to queue with priority
const messageId = await messageQueue.add(
    async () => {
        await sock.sendMessage(jid, { text: 'Important message!' })
    },
    10  // Priority (higher = processed first)
)

// Check queue status
console.log('Queue size:', messageQueue.getQueueSize())
console.log('Is processing:', messageQueue.isProcessing())
```

**Benefits**:
- Automatic retry on failures
- Priority-based processing
- Prevents message loss
- Better error handling

---

### 3. Connection Health Monitoring

```typescript
import { ConnectionMonitor } from '@bermuda/baileys-modified'

const monitor = new ConnectionMonitor({
    enableMonitoring: true,
    healthCheckInterval: 60000,  // Check every 60 seconds
    maxDisconnections: 5         // Alert after 5 disconnections
}, sock.logger)

// Hook into connection events
sock.ev.on('connection.update', (update) => {
    monitor.onConnectionUpdate(update)
})

// Hook into message events
sock.ev.on('messages.upsert', () => {
    monitor.onMessageReceived()
})

// Get health status
const health = monitor.getHealth()
console.log('Status:', health.status)           // healthy | unstable | critical
console.log('Uptime:', health.uptime)           // Milliseconds
console.log('Disconnections:', health.disconnections)
console.log('Messages Sent:', health.messagesSent)
console.log('Messages Received:', health.messagesReceived)
```

**Console Output Example**:
```
【BERMUDA】 ✓ Connection healthy | Uptime: 45m | Sent: 127 | Received: 89
```

---

### 4. Auto-Reconnect with Exponential Backoff

```typescript
import { AutoReconnect } from '@bermuda/baileys-modified'

const autoReconnect = new AutoReconnect({
    maxRetries: -1,                 // Infinite retries (-1)
    initialDelay: 1000,             // Start with 1 second
    maxDelay: 60000,                // Max 60 seconds
    backoffMultiplier: 2,           // Double delay each time
    enableExponentialBackoff: true  // Use exponential backoff
}, sock.logger)

sock.ev.on('connection.update', async (update) => {
    if(update.connection === 'close') {
        await autoReconnect.scheduleReconnect(async () => {
            await connectToWhatsApp()
        })
    }
})
```

**Reconnection Pattern**:
- Attempt 1: Wait 1s
- Attempt 2: Wait 2s
- Attempt 3: Wait 4s
- Attempt 4: Wait 8s
- Attempt 5: Wait 16s
- ...
- Attempt N: Wait up to 60s (max)

---

### 5. Lifecycle Hooks & Middleware

```typescript
import { HookManager } from '@bermuda/baileys-modified'

const hooks = new HookManager({
    onBeforeConnect: async () => {
        console.log('About to connect...')
    },
    onAfterConnect: async (state) => {
        console.log('Connected!', state)
    },
    onMessageReceive: async (message) => {
        console.log('Received:', message)
    },
    onMessageSend: async (message) => {
        console.log('Sent:', message)
    },
    onError: async (error) => {
        console.error('Error:', error)
    }
}, sock.logger)

// Trigger hooks
await hooks.trigger('beforeConnect')
await hooks.trigger('afterConnect', connectionState)

// Add middleware for message processing
hooks.use(async (context, next) => {
    console.log('Middleware 1: Processing message')
    context.timestamp = Date.now()
    await next()
})

hooks.use(async (context, next) => {
    console.log('Middleware 2: Logging message')
    console.log('Time:', context.timestamp)
    await next()
})

// Execute middleware chain
await hooks.executeMiddlewares({
    message: msg,
    from: msg.key.remoteJid,
    body: msg.message?.conversation
})
```

---

### 6. Enhanced Media Handling

```typescript
import { MediaHandler } from '@bermuda/baileys-modified'

const mediaHandler = new MediaHandler(sock.logger)

// Upload with retry and progress
const uploadResult = await mediaHandler.uploadWithRetry(
    async () => {
        return await sock.sendMessage(jid, {
            image: { url: './image.jpg' },
            caption: 'Check this out!'
        })
    },
    {
        maxRetries: 3,
        retryDelay: 2000,
        onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`)
        }
    }
)

// Download with retry and timeout
const buffer = await mediaHandler.downloadWithRetry(
    async () => {
        return await downloadMediaMessage(msg, 'buffer', {})
    },
    {
        maxRetries: 3,
        retryDelay: 2000,
        timeout: 30000,  // 30 second timeout
        onProgress: (progress) => {
            console.log(`Download progress: ${progress}%`)
        }
    }
)
```

---

### 7. Advanced Logger

```typescript
import { BermudaLogger } from '@bermuda/baileys-modified'

const logger = new BermudaLogger({
    level: 'info',              // trace | debug | info | warn | error | fatal
    enableColors: true,         // Colorful output
    enableTimestamp: true,      // Show timestamps
    enablePrefix: true,         // Show [BERMUDA] prefix
    customPrefix: 'MY-BOT'      // Custom prefix
}, sock.logger)

logger.trace('Trace message')
logger.debug('Debug message')
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message')
logger.fatal('Fatal message')

// Change log level dynamically
logger.setLevel('debug')
```

**Output Example**:
```
[2025-10-21T10:30:45.123Z] [MY-BOT] [INFO] Connection established
[2025-10-21T10:30:50.456Z] [MY-BOT] [WARN] Rate limit approaching
```

---

## 🔧 Configuration

### Complete Configuration Example

```typescript
import makeWASocket, {
    useMultiFileAuthState,
    RateLimiter,
    MessageQueue,
    ConnectionMonitor,
    AutoReconnect,
    HookManager,
    MediaHandler,
    BermudaLogger
} from '@bermuda/baileys-modified'

async function createBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    
    // Create socket
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['BERMUDA Bot', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60000,
    })
    
    // Initialize BERMUDA features
    const logger = new BermudaLogger({ level: 'info' }, sock.logger)
    const rateLimiter = new RateLimiter({ maxRequests: 20, timeWindow: 10000 }, sock.logger)
    const messageQueue = new MessageQueue({ maxRetries: 3, retryDelay: 1000 }, sock.logger)
    const monitor = new ConnectionMonitor({ enableMonitoring: true }, sock.logger)
    const autoReconnect = new AutoReconnect({ maxRetries: -1 }, sock.logger)
    const hooks = new HookManager({}, sock.logger)
    const mediaHandler = new MediaHandler(sock.logger)
    
    // Setup hooks
    sock.ev.on('connection.update', async (update) => {
        monitor.onConnectionUpdate(update)
        
        if(update.connection === 'close') {
            await hooks.trigger('beforeDisconnect')
            await autoReconnect.scheduleReconnect(createBot)
        } else if(update.connection === 'open') {
            await hooks.trigger('afterConnect', update)
            logger.info('Bot is ready!')
        }
    })
    
    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('messages.upsert', async (m) => {
        monitor.onMessageReceived()
        
        const msg = m.messages[0]
        if(!msg.key.fromMe && m.type === 'notify') {
            await hooks.trigger('messageReceive', msg)
            
            // Process with rate limiting and queue
            await messageQueue.add(async () => {
                await rateLimiter.acquire()
                await sock.sendMessage(msg.key.remoteJid!, {
                    text: 'Hello from BERMUDA!'
                })
                monitor.onMessageSent()
            })
        }
    })
    
    return sock
}

createBot()
```

---

## 📚 API Documentation

### RateLimiter

```typescript
const rateLimiter = new RateLimiter(config, logger)

await rateLimiter.acquire()              // Wait if needed, then proceed
rateLimiter.getRemainingRequests()       // Get remaining requests
rateLimiter.reset()                      // Reset limiter
```

### MessageQueue

```typescript
const queue = new MessageQueue(config, logger)

await queue.add(fn, priority)            // Add message to queue
queue.getQueueSize()                     // Get queue size
queue.isProcessing()                     // Check if processing
queue.clear()                            // Clear queue
```

### ConnectionMonitor

```typescript
const monitor = new ConnectionMonitor(config, logger)

monitor.onConnectionUpdate(state)        // Update on connection change
monitor.onReconnectAttempt()            // Track reconnect attempts
monitor.onMessageSent()                 // Track sent messages
monitor.onMessageReceived()             // Track received messages
monitor.getHealth()                     // Get health status
monitor.reset()                         // Reset monitoring
monitor.stop()                          // Stop monitoring
```

### AutoReconnect

```typescript
const reconnect = new AutoReconnect(config, logger)

await reconnect.scheduleReconnect(fn)    // Schedule reconnection
reconnect.cancel()                       // Cancel reconnection
reconnect.reset()                        // Reset attempts
reconnect.getAttempts()                 // Get attempt count
reconnect.isActive()                    // Check if active
```

### HookManager

```typescript
const hooks = new HookManager(config, logger)

hooks.on(event, handler)                 // Register hook
hooks.off(event, handler)                // Remove hook
await hooks.trigger(event, ...args)      // Trigger hook
hooks.use(middleware)                    // Add middleware
await hooks.executeMiddlewares(context)  // Execute middleware chain
hooks.clear()                            // Clear all hooks
```

### MediaHandler

```typescript
const handler = new MediaHandler(logger)

await handler.uploadWithRetry(fn, opts)     // Upload with retry
await handler.downloadWithRetry(fn, opts)   // Download with retry
handler.trackUploadProgress(id, progress)   // Track upload
handler.trackDownloadProgress(id, progress) // Track download
```

### BermudaLogger

```typescript
const logger = new BermudaLogger(config, pinoLogger)

logger.trace(msg, data)                  // Trace level
logger.debug(msg, data)                  // Debug level
logger.info(msg, data)                   // Info level
logger.warn(msg, data)                   // Warning level
logger.error(msg, data)                  // Error level
logger.fatal(msg, data)                  // Fatal level
logger.setLevel(level)                   // Change level
logger.getLevel()                        // Get level
```

---

## 💡 Examples

### Example 1: Simple Echo Bot

```typescript
import makeWASocket, { useMultiFileAuthState } from '@bermuda/baileys-modified'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ auth: state, printQRInTerminal: true })
    
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if(!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid!, {
                text: `You said: ${msg.message.conversation}`
            })
        }
    })
}

startBot()
```

### Example 2: Bot with All Features

See `Example/bermuda-example.ts` for a complete production-ready example.

---

## 🎨 Visual Preview

When you start your bot, you'll see:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ██████╗  █████╗ ██╗██╗     ███████╗██╗   ██╗███████╗  ║
║    ██╔══██╗██╔══██╗██║██║     ██╔════╝╚██╗ ██╔╝██╔════╝  ║
║    ██████╔╝███████║██║██║     █████╗   ╚████╔╝ ███████╗  ║
║    ██╔══██╗██╔══██║██║██║     ██╔══╝    ╚██╔╝  ╚════██║  ║
║    ██████╔╝██║  ██║██║███████╗███████╗   ██║   ███████║  ║
║    ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝   ╚═╝   ╚══════╝  ║
║                                                           ║
║              🌴 BERMUDA CYBER FAMILY 🌴                   ║
║                                                           ║
║           Modified Enhanced WhatsApp Library             ║
║         Powered By BERMUDA Cyber Family © 2025           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Enhanced Features Loaded:
  ✓ Advanced Auto-Reconnect System
  ✓ Rate Limiting Protection
  ✓ Enhanced Media Handling
  ✓ Custom Event Hooks & Middleware
  ✓ Message Queue Management
  ✓ Connection Health Monitoring
  ✓ Advanced Logging System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Version: 1.0.0-bermuda
🔗 Original: WhiskeySockets/Baileys
⚡ Enhanced By: BERMUDA Cyber Family

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🙏 Credits

### Original Baileys
- **Author**: Adhiraj Singh ([@adiwajshing](https://github.com/adiwajshing))
- **Current Maintainer**: WhiskeySockets
- **Repository**: [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)

### BERMUDA Edition
- **Enhanced By**: BERMUDA Cyber Family
- **Version**: 1.0.0-bermuda
- **Year**: 2025

---

## 📄 License

MIT License

Copyright (c) 2025 BERMUDA Cyber Family  
Copyright (c) 2023 WhiskeySockets  
Copyright (c) 2021 Adhiraj Singh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## ⚠️ Disclaimer

This library is NOT affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or Meta Platforms, Inc. This is an independent and unofficial software. Use at your own risk.

WhatsApp may ban your number for using unofficial clients. We are not responsible for any bans or limitations imposed on your account.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/BERMUDA-CyberFamily/baileys-bermuda/issues)
- **Discussions**: [GitHub Discussions](https://github.com/BERMUDA-CyberFamily/baileys-bermuda/discussions)

---

<div align="center">

**Made with ❤️ by BERMUDA Cyber Family**

⭐ Star us on GitHub if you find this useful!

</div>
