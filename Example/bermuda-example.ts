import makeWASocket, {
	DisconnectReason,
	useMultiFileAuthState,
	RateLimiter,
	MessageQueue,
	ConnectionMonitor,
	AutoReconnect,
	HookManager,
	MediaHandler,
	BermudaLogger,
	logBermuda
} from '../src'

async function startBermudaBot() {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info_bermuda')

	const sock = makeWASocket({
		auth: state,
		printQRInTerminal: true,
		browser: ['BERMUDA Bot', 'Chrome', '1.0.0'],
		defaultQueryTimeoutMs: 60000,
	})

	const logger = new BermudaLogger({
		level: 'info',
		enableColors: true,
		enableTimestamp: true,
		customPrefix: 'BERMUDA-BOT'
	}, sock.logger)

	const rateLimiter = new RateLimiter({
		maxRequests: 20,
		timeWindow: 10000,
		enableWarnings: true
	}, sock.logger)

	const messageQueue = new MessageQueue({
		maxRetries: 3,
		retryDelay: 1000,
		maxQueueSize: 100,
		enableLogs: true
	}, sock.logger)

	const monitor = new ConnectionMonitor({
		enableMonitoring: true,
		healthCheckInterval: 60000,
		maxDisconnections: 5
	}, sock.logger)

	const autoReconnect = new AutoReconnect({
		maxRetries: -1,
		initialDelay: 1000,
		maxDelay: 60000,
		backoffMultiplier: 2,
		enableExponentialBackoff: true
	}, sock.logger)

	const hooks = new HookManager({
		onBeforeConnect: async () => {
			logger.info('Preparing to connect...')
		},
		onAfterConnect: async (state) => {
			logger.info('Connected successfully!')
		},
		onBeforeDisconnect: async () => {
			logger.warn('About to disconnect...')
		},
		onAfterDisconnect: async (reason) => {
			logger.warn(`Disconnected: ${reason || 'Unknown reason'}`)
		},
		onMessageReceive: async (message) => {
			logger.debug('Message received')
		},
		onMessageSend: async (message) => {
			logger.debug('Message sent')
		},
		onError: async (error) => {
			logger.error('Error occurred', { error })
		},
		onReconnect: async (attempt) => {
			logger.info(`Reconnection attempt #${attempt}`)
		}
	}, sock.logger)

	const mediaHandler = new MediaHandler(sock.logger)

	hooks.use(async (context, next) => {
		logger.debug('Middleware: Logging message context')
		context.processedAt = Date.now()
		await next()
	})

	hooks.use(async (context, next) => {
		logger.debug('Middleware: Checking spam')
		await next()
	})

	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect } = update

		monitor.onConnectionUpdate(update)

		if(connection === 'close') {
			await hooks.trigger('beforeDisconnect')

			const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
			
			if(shouldReconnect) {
				monitor.onReconnectAttempt()
				await hooks.trigger('reconnect', autoReconnect.getAttempts() + 1)
				
				await autoReconnect.scheduleReconnect(async () => {
					await startBermudaBot()
				})
			} else {
				logBermuda('error', 'Logged out. Please scan QR code again.')
			}

			await hooks.trigger('afterDisconnect', lastDisconnect?.error?.message)
		} else if(connection === 'open') {
			await hooks.trigger('afterConnect', update)
			autoReconnect.reset()
			
			const health = monitor.getHealth()
			logger.info(`Bot ready! Health: ${health.status}`)
		}
	})

	sock.ev.on('messages.upsert', async (m) => {
		const msg = m.messages[0]
		
		if(!msg.message || msg.key.fromMe) return

		monitor.onMessageReceived()
		await hooks.trigger('messageReceive', msg)

		const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
		const from = msg.key.remoteJid!

		await hooks.executeMiddlewares({
			message: msg,
			from,
			type: 'text',
			body: messageText
		})

		if(messageText.toLowerCase() === '!ping') {
			await messageQueue.add(async () => {
				await rateLimiter.acquire()
				await sock.sendMessage(from, { text: '🏓 Pong! BERMUDA Bot is online!' })
				monitor.onMessageSent()
				await hooks.trigger('messageSend', { to: from, text: 'Pong!' })
			}, 10)
		}

		else if(messageText.toLowerCase() === '!health') {
			const health = monitor.getHealth()
			const uptimeMinutes = Math.floor(health.uptime / 60000)
			
			const healthText = `
🏥 *Connection Health Report*

📊 Status: ${health.status}
⏱️ Uptime: ${uptimeMinutes} minutes
🔌 Disconnections: ${health.disconnections}
🔄 Reconnect Attempts: ${health.reconnectAttempts}
📤 Messages Sent: ${health.messagesSent}
📥 Messages Received: ${health.messagesReceived}

🌴 Powered by BERMUDA Cyber Family
			`.trim()

			await messageQueue.add(async () => {
				await rateLimiter.acquire()
				await sock.sendMessage(from, { text: healthText })
				monitor.onMessageSent()
			}, 9)
		}

		else if(messageText.toLowerCase() === '!queue') {
			const queueSize = messageQueue.getQueueSize()
			const isProcessing = messageQueue.isProcessing()
			const remaining = rateLimiter.getRemainingRequests()

			const queueText = `
📦 *Queue Status*

📊 Queue Size: ${queueSize}
⚙️ Processing: ${isProcessing ? 'Yes' : 'No'}
🚦 Rate Limit Remaining: ${remaining}/20

🌴 BERMUDA Message Queue System
			`.trim()

			await messageQueue.add(async () => {
				await rateLimiter.acquire()
				await sock.sendMessage(from, { text: queueText })
				monitor.onMessageSent()
			}, 8)
		}

		else if(messageText.toLowerCase() === '!help') {
			const helpText = `
🌴 *BERMUDA Bot Commands*

🏓 !ping - Check if bot is online
🏥 !health - Get connection health status
📦 !queue - Check message queue status
❓ !help - Show this help message
ℹ️ !about - About BERMUDA Bot

*Features:*
✅ Auto-reconnect with exponential backoff
✅ Rate limiting protection (20 msg/10s)
✅ Message queue with retry system
✅ Connection health monitoring
✅ Advanced logging system
✅ Enhanced media handling

🌴 Powered by BERMUDA Cyber Family
			`.trim()

			await messageQueue.add(async () => {
				await rateLimiter.acquire()
				await sock.sendMessage(from, { text: helpText })
				monitor.onMessageSent()
			}, 7)
		}

		else if(messageText.toLowerCase() === '!about') {
			const aboutText = `
🌴 *BERMUDA Baileys Bot*

📦 Version: 1.0.0-bermuda
🔧 Based on: WhiskeySockets/Baileys
⚡ Enhanced By: BERMUDA Cyber Family

*Special Features:*
• Rainbow gradient startup banner
• Advanced connection management
• Rate limiting & anti-ban protection
• Message queue with auto-retry
• Connection health monitoring
• Lifecycle hooks & middleware
• Enhanced media handling
• Colorful logging system

🔗 GitHub: BERMUDA-CyberFamily/baileys-bermuda
📜 License: MIT

Made with ❤️ by BERMUDA Cyber Family
			`.trim()

			await messageQueue.add(async () => {
				await rateLimiter.acquire()
				await sock.sendMessage(from, { text: aboutText })
				monitor.onMessageSent()
			}, 6)
		}

		else if(msg.message?.imageMessage) {
			logger.info('Received image, downloading with retry...')

			try {
				const buffer = await mediaHandler.downloadWithRetry(
					async () => {
						const stream = await sock.downloadMediaMessage(msg)
						return stream as Buffer
					},
					{
						maxRetries: 3,
						retryDelay: 2000,
						timeout: 30000,
						onProgress: (progress) => {
							logger.debug(`Download progress: ${progress}%`)
						}
					}
				)

				logger.info(`Image downloaded successfully: ${buffer.length} bytes`)

				await messageQueue.add(async () => {
					await rateLimiter.acquire()
					await sock.sendMessage(from, { 
						text: `✅ Image received! Size: ${(buffer.length / 1024).toFixed(2)} KB\n\n🌴 Processed by BERMUDA Bot` 
					})
					monitor.onMessageSent()
				})
			} catch (error) {
				logger.error('Failed to download image', { error })
				await hooks.trigger('error', error as Error)
			}
		}
	})

	logger.info('BERMUDA Bot started successfully!')
	logger.info('Waiting for messages...')

	return sock
}

startBermudaBot().catch(err => {
	console.error('Fatal error:', err)
	process.exit(1)
})
