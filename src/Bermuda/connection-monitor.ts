import type { ConnectionState, Logger } from '../Types'
import { logBermuda } from './banner'

export interface ConnectionHealth {
	status: 'healthy' | 'unstable' | 'critical'
	uptime: number
	disconnections: number
	lastDisconnect?: number
	reconnectAttempts: number
	messagesSent: number
	messagesReceived: number
}

export interface ConnectionMonitorConfig {
	enableMonitoring?: boolean
	healthCheckInterval?: number
	maxDisconnections?: number
}

export class ConnectionMonitor {
	private health: ConnectionHealth
	private startTime: number
	private config: Required<ConnectionMonitorConfig>
	private logger?: Logger
	private healthCheckTimer?: NodeJS.Timeout

	constructor(config: ConnectionMonitorConfig = {}, logger?: Logger) {
		this.config = {
			enableMonitoring: config.enableMonitoring !== false,
			healthCheckInterval: config.healthCheckInterval || 60000,
			maxDisconnections: config.maxDisconnections || 5
		}
		this.logger = logger
		this.startTime = Date.now()
		
		this.health = {
			status: 'healthy',
			uptime: 0,
			disconnections: 0,
			reconnectAttempts: 0,
			messagesSent: 0,
			messagesReceived: 0
		}

		if (this.config.enableMonitoring) {
			this.startHealthCheck()
		}
	}

	private startHealthCheck(): void {
		this.healthCheckTimer = setInterval(() => {
			this.updateHealth()
			this.logHealth()
		}, this.config.healthCheckInterval)
	}

	private updateHealth(): void {
		this.health.uptime = Date.now() - this.startTime

		if (this.health.disconnections === 0) {
			this.health.status = 'healthy'
		} else if (this.health.disconnections < this.config.maxDisconnections) {
			this.health.status = 'unstable'
		} else {
			this.health.status = 'critical'
		}
	}

	private logHealth(): void {
		const uptimeMinutes = Math.floor(this.health.uptime / 60000)
		
		if (this.health.status === 'healthy') {
			logBermuda('success', `Connection healthy | Uptime: ${uptimeMinutes}m | Sent: ${this.health.messagesSent} | Received: ${this.health.messagesReceived}`)
		} else if (this.health.status === 'unstable') {
			logBermuda('warning', `Connection unstable | Disconnections: ${this.health.disconnections} | Reconnects: ${this.health.reconnectAttempts}`)
		} else {
			logBermuda('error', `Connection critical | Multiple disconnections detected: ${this.health.disconnections}`)
		}

		this.logger?.info({ health: this.health }, 'Connection health check')
	}

	onConnectionUpdate(state: Partial<ConnectionState>): void {
		if (state.connection === 'close') {
			this.health.disconnections++
			this.health.lastDisconnect = Date.now()
			logBermuda('warning', `Connection lost (Total: ${this.health.disconnections})`)
		} else if (state.connection === 'open') {
			logBermuda('success', 'Connection established')
		}

		this.updateHealth()
	}

	onReconnectAttempt(): void {
		this.health.reconnectAttempts++
		logBermuda('info', `Reconnect attempt #${this.health.reconnectAttempts}`)
	}

	onMessageSent(): void {
		this.health.messagesSent++
	}

	onMessageReceived(): void {
		this.health.messagesReceived++
	}

	getHealth(): ConnectionHealth {
		this.updateHealth()
		return { ...this.health }
	}

	reset(): void {
		this.health = {
			status: 'healthy',
			uptime: 0,
			disconnections: 0,
			reconnectAttempts: 0,
			messagesSent: 0,
			messagesReceived: 0
		}
		this.startTime = Date.now()
		logBermuda('info', 'Connection health reset')
	}

	stop(): void {
		if (this.healthCheckTimer) {
			clearInterval(this.healthCheckTimer)
		}
	}
}
