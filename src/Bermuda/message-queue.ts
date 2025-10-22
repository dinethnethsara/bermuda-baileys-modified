import type { Logger } from 'pino'
import { logBermuda } from './banner'

export interface QueuedMessage {
	id: string
	execute: () => Promise<any>
	retries: number
	maxRetries: number
	timestamp: number
	priority: number
}

export interface MessageQueueConfig {
	maxRetries?: number
	retryDelay?: number
	maxQueueSize?: number
	enableLogs?: boolean
}

export class MessageQueue {
	private queue: QueuedMessage[] = []
	private processing: boolean = false
	private config: Required<MessageQueueConfig>
	private logger?: Logger

	constructor(config: MessageQueueConfig = {}, logger?: Logger) {
		this.config = {
			maxRetries: config.maxRetries || 3,
			retryDelay: config.retryDelay || 1000,
			maxQueueSize: config.maxQueueSize || 100,
			enableLogs: config.enableLogs !== false
		}
		this.logger = logger
	}

	async add(execute: () => Promise<any>, priority: number = 5): Promise<string> {
		const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		
		if (this.queue.length >= this.config.maxQueueSize) {
			const removed = this.queue.pop()
			if (this.config.enableLogs) {
				logBermuda('warning', `Queue full! Removed oldest message: ${removed?.id}`)
			}
		}

		const queuedMessage: QueuedMessage = {
			id,
			execute,
			retries: 0,
			maxRetries: this.config.maxRetries,
			timestamp: Date.now(),
			priority
		}

		this.queue.push(queuedMessage)
		this.queue.sort((a, b) => b.priority - a.priority)

		if (this.config.enableLogs) {
			logBermuda('info', `Message queued: ${id} (Priority: ${priority})`)
		}

		if (!this.processing) {
			this.processQueue()
		}

		return id
	}

	private async processQueue(): Promise<void> {
		if (this.processing || this.queue.length === 0) {
			return
		}

		this.processing = true

		while (this.queue.length > 0) {
			const message = this.queue.shift()
			if (!message) break

			try {
				await message.execute()
				
				if (this.config.enableLogs) {
					logBermuda('success', `Message sent: ${message.id}`)
				}
				this.logger?.info({ messageId: message.id }, 'Message sent successfully')
			} catch (error) {
				message.retries++
				
				if (message.retries < message.maxRetries) {
					if (this.config.enableLogs) {
						logBermuda('warning', `Message failed (${message.retries}/${message.maxRetries}): ${message.id}. Retrying...`)
					}
					
					await this.delay(this.config.retryDelay * message.retries)
					
					this.queue.unshift(message)
				} else {
					if (this.config.enableLogs) {
						logBermuda('error', `Message failed permanently: ${message.id}`)
					}
					this.logger?.error({ messageId: message.id, error }, 'Message failed after max retries')
				}
			}
		}

		this.processing = false
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	getQueueSize(): number {
		return this.queue.length
	}

	isProcessing(): boolean {
		return this.processing
	}

	clear(): void {
		this.queue = []
		if (this.config.enableLogs) {
			logBermuda('info', 'Message queue cleared')
		}
	}
}
