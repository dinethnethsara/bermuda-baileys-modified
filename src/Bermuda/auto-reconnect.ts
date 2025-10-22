import type { Logger } from 'pino'
import { logBermuda } from './banner'

export interface ReconnectConfig {
	maxRetries?: number
	initialDelay?: number
	maxDelay?: number
	backoffMultiplier?: number
	enableExponentialBackoff?: boolean
}

export class AutoReconnect {
	private attempts: number = 0
	private config: Required<ReconnectConfig>
	private logger?: Logger
	private reconnectTimer?: NodeJS.Timeout
	private isReconnecting: boolean = false

	constructor(config: ReconnectConfig = {}, logger?: Logger) {
		this.config = {
			maxRetries: config.maxRetries || -1,
			initialDelay: config.initialDelay || 1000,
			maxDelay: config.maxDelay || 60000,
			backoffMultiplier: config.backoffMultiplier || 2,
			enableExponentialBackoff: config.enableExponentialBackoff !== false
		}
		this.logger = logger
	}

	async shouldReconnect(): Promise<boolean> {
		if (this.config.maxRetries === -1) {
			return true
		}
		
		return this.attempts < this.config.maxRetries
	}

	getNextDelay(): number {
		if (!this.config.enableExponentialBackoff) {
			return this.config.initialDelay
		}

		const delay = Math.min(
			this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.attempts),
			this.config.maxDelay
		)

		return delay
	}

	async scheduleReconnect(reconnectFn: () => Promise<void>): Promise<void> {
		if (this.isReconnecting) {
			logBermuda('warning', 'Reconnection already in progress')
			return
		}

		const canReconnect = await this.shouldReconnect()
		
		if (!canReconnect) {
			logBermuda('error', `Max reconnection attempts reached (${this.config.maxRetries})`)
			this.logger?.error({ attempts: this.attempts }, 'Max reconnection attempts reached')
			return
		}

		this.isReconnecting = true
		this.attempts++

		const delay = this.getNextDelay()
		const delaySeconds = (delay / 1000).toFixed(1)

		logBermuda('info', `Reconnecting in ${delaySeconds}s (Attempt ${this.attempts})`)
		this.logger?.info({ attempt: this.attempts, delay }, 'Scheduling reconnection')

		this.reconnectTimer = setTimeout(async () => {
			try {
				logBermuda('info', `Reconnecting now... (Attempt ${this.attempts})`)
				await reconnectFn()
				
				logBermuda('success', 'Reconnected successfully!')
				this.logger?.info({ attempt: this.attempts }, 'Reconnection successful')
				
				this.reset()
			} catch (error) {
				logBermuda('error', `Reconnection failed: ${(error as Error).message}`)
				this.logger?.error({ error, attempt: this.attempts }, 'Reconnection failed')
				
				this.isReconnecting = false
				
				await this.scheduleReconnect(reconnectFn)
			}
		}, delay)
	}

	cancel(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
		this.isReconnecting = false
		logBermuda('info', 'Reconnection cancelled')
	}

	reset(): void {
		this.attempts = 0
		this.isReconnecting = false
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
	}

	getAttempts(): number {
		return this.attempts
	}

	isActive(): boolean {
		return this.isReconnecting
	}
}
