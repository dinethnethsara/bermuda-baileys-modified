import makeWASocket, {
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

async function demonstrateRateLimiter() {
	console.log('\n=== Rate Limiter Demo ===\n')
	
	const rateLimiter = new RateLimiter({
		maxRequests: 5,
		timeWindow: 5000,
		enableWarnings: true
	})

	for(let i = 1; i <= 10; i++) {
		console.log(`Request ${i}...`)
		await rateLimiter.acquire()
		console.log(`Request ${i} processed!`)
		console.log(`Remaining: ${rateLimiter.getRemainingRequests()}`)
	}
}

async function demonstrateMessageQueue() {
	console.log('\n=== Message Queue Demo ===\n')
	
	const queue = new MessageQueue({
		maxRetries: 3,
		retryDelay: 1000,
		enableLogs: true
	})

	const messageIds = []

	for(let i = 1; i <= 5; i++) {
		const id = await queue.add(
			async () => {
				console.log(`Processing message ${i}...`)
				
				if(i === 3) {
					throw new Error('Simulated failure')
				}
				
				await new Promise(resolve => setTimeout(resolve, 500))
			},
			10 - i
		)
		messageIds.push(id)
	}

	await new Promise(resolve => setTimeout(resolve, 10000))
	
	console.log(`Final queue size: ${queue.getQueueSize()}`)
}

async function demonstrateConnectionMonitor() {
	console.log('\n=== Connection Monitor Demo ===\n')
	
	const monitor = new ConnectionMonitor({
		enableMonitoring: true,
		healthCheckInterval: 5000,
		maxDisconnections: 3
	})

	monitor.onConnectionUpdate({ connection: 'open' })
	
	for(let i = 0; i < 10; i++) {
		monitor.onMessageSent()
		monitor.onMessageReceived()
		await new Promise(resolve => setTimeout(resolve, 500))
	}

	const health = monitor.getHealth()
	console.log('\nHealth Status:')
	console.log(`  Status: ${health.status}`)
	console.log(`  Uptime: ${health.uptime}ms`)
	console.log(`  Messages Sent: ${health.messagesSent}`)
	console.log(`  Messages Received: ${health.messagesReceived}`)
	
	monitor.stop()
}

async function demonstrateAutoReconnect() {
	console.log('\n=== Auto Reconnect Demo ===\n')
	
	const reconnect = new AutoReconnect({
		maxRetries: 5,
		initialDelay: 1000,
		maxDelay: 10000,
		backoffMultiplier: 2,
		enableExponentialBackoff: true
	})

	console.log('Simulating reconnection attempts...')
	
	for(let i = 0; i < 5; i++) {
		const delay = reconnect.getNextDelay()
		console.log(`Attempt ${reconnect.getAttempts() + 1}: Will wait ${delay}ms`)
		
		reconnect['attempts']++
	}
	
	reconnect.reset()
	console.log('Reset complete')
}

async function demonstrateHooks() {
	console.log('\n=== Hooks & Middleware Demo ===\n')
	
	const hooks = new HookManager({
		onBeforeConnect: () => console.log('Hook: Before connect'),
		onAfterConnect: () => console.log('Hook: After connect'),
		onMessageReceive: (msg) => console.log('Hook: Message received', msg)
	})

	hooks.use(async (context, next) => {
		console.log('Middleware 1: Start')
		context.timestamp = Date.now()
		await next()
		console.log('Middleware 1: End')
	})

	hooks.use(async (context, next) => {
		console.log('Middleware 2: Processing')
		console.log('  Timestamp:', context.timestamp)
		await next()
		console.log('Middleware 2: Done')
	})

	await hooks.trigger('beforeConnect')
	await hooks.trigger('afterConnect')

	await hooks.executeMiddlewares({
		message: 'Test message',
		from: '1234567890'
	})

	console.log(`Total hooks: ${hooks.getHookCount()}`)
	console.log(`Total middleware: ${hooks.getMiddlewareCount()}`)
}

async function demonstrateMediaHandler() {
	console.log('\n=== Media Handler Demo ===\n')
	
	const handler = new MediaHandler()

	console.log('Simulating media upload with retry...')
	
	let attempt = 0
	await handler.uploadWithRetry(
		async () => {
			attempt++
			console.log(`Upload attempt ${attempt}`)
			
			if(attempt < 2) {
				throw new Error('Simulated upload failure')
			}
			
			return { success: true }
		},
		{
			maxRetries: 3,
			retryDelay: 1000,
			onProgress: (progress) => {
				console.log(`Progress: ${progress}%`)
			}
		}
	)

	console.log('Upload successful!')
}

async function demonstrateLogger() {
	console.log('\n=== Logger Demo ===\n')
	
	const logger = new BermudaLogger({
		level: 'trace',
		enableColors: true,
		enableTimestamp: true,
		customPrefix: 'DEMO'
	})

	logger.trace('This is a trace message')
	logger.debug('This is a debug message')
	logger.info('This is an info message')
	logger.warn('This is a warning message')
	logger.error('This is an error message')
	
	logger.setLevel('warn')
	logger.info('This will not be shown')
	logger.warn('But this will be shown')
	
	console.log(`\nCurrent log level: ${logger.getLevel()}`)
}

async function runAllDemos() {
	console.log('\n╔═══════════════════════════════════════════════════════════╗')
	console.log('║         BERMUDA BAILEYS FEATURE SHOWCASE                  ║')
	console.log('╚═══════════════════════════════════════════════════════════╝')

	try {
		await demonstrateLogger()
		await demonstrateRateLimiter()
		await demonstrateMessageQueue()
		await demonstrateConnectionMonitor()
		await demonstrateAutoReconnect()
		await demonstrateHooks()
		await demonstrateMediaHandler()

		console.log('\n✅ All demos completed successfully!')
		console.log('🌴 BERMUDA Cyber Family\n')
	} catch (error) {
		console.error('Demo error:', error)
	}
}

runAllDemos()
