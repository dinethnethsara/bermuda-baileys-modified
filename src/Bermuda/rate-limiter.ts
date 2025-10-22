import type { Logger } from 'pino'
import { logBermuda } from './banner'

export interface RateLimiterConfig {
	maxRequests?: number
	timeWindow?: number
	enableWarnings?: boolean
}

export class RateLimiter {
	private requests: number[] = []
	private maxRequests: number
	private timeWindow: number
	private enableWarnings: boolean
	private logger?: Logger

	constructor(config: RateLimiterConfig = {}, logger?: Logger) {
		this.maxRequests = config.maxRequests || 20
		this.timeWindow = config.timeWindow || 10000
		this.enableWarnings = config.enableWarnings !== false
		this.logger = logger
	}

	async acquire(): Promise<void> {
		const now = Date.now()
		
		this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow)
		
		if (this.requests.length >= this.maxRequests) {
			const oldestRequest = this.requests[0]
			const waitTime = this.timeWindow - (now - oldestRequest)
			
			if (this.enableWarnings) {
				logBermuda('warning', `Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`)
				this.logger?.warn({ waitTime }, 'Rate limit protection activated')
			}
			
			await this.wait(waitTime)
			
			return this.acquire()
		}
		
		this.requests.push(now)
	}

	private wait(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	getRemainingRequests(): number {
		const now = Date.now()
		this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow)
		return Math.max(0, this.maxRequests - this.requests.length)
	}

	reset(): void {
		this.requests = []
	}
}
