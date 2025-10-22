import type { ConnectionState, Logger, proto } from '../Types'
import { logBermuda } from './banner'

export type HookFunction = (...args: any[]) => Promise<void> | void

export interface HooksConfig {
	onBeforeConnect?: () => Promise<void> | void
	onAfterConnect?: (connectionState: ConnectionState) => Promise<void> | void
	onBeforeDisconnect?: () => Promise<void> | void
	onAfterDisconnect?: (reason?: string) => Promise<void> | void
	onMessageReceive?: (message: proto.IWebMessageInfo) => Promise<void> | void
	onMessageSend?: (message: any) => Promise<void> | void
	onError?: (error: Error) => Promise<void> | void
	onReconnect?: (attempt: number) => Promise<void> | void
}

export interface MiddlewareContext {
	message?: proto.IWebMessageInfo
	from?: string
	type?: string
	body?: string
	[key: string]: any
}

export type Middleware = (
	context: MiddlewareContext,
	next: () => Promise<void>
) => Promise<void>

export class HookManager {
	private hooks: Map<string, HookFunction[]> = new Map()
	private middlewares: Middleware[] = []
	private logger?: Logger

	constructor(config: HooksConfig = {}, logger?: Logger) {
		this.logger = logger
		
		if (config.onBeforeConnect) this.on('beforeConnect', config.onBeforeConnect)
		if (config.onAfterConnect) this.on('afterConnect', config.onAfterConnect)
		if (config.onBeforeDisconnect) this.on('beforeDisconnect', config.onBeforeDisconnect)
		if (config.onAfterDisconnect) this.on('afterDisconnect', config.onAfterDisconnect)
		if (config.onMessageReceive) this.on('messageReceive', config.onMessageReceive)
		if (config.onMessageSend) this.on('messageSend', config.onMessageSend)
		if (config.onError) this.on('error', config.onError)
		if (config.onReconnect) this.on('reconnect', config.onReconnect)
	}

	on(event: string, handler: HookFunction): void {
		if (!this.hooks.has(event)) {
			this.hooks.set(event, [])
		}
		this.hooks.get(event)!.push(handler)
		logBermuda('info', `Hook registered: ${event}`)
	}

	off(event: string, handler: HookFunction): void {
		const handlers = this.hooks.get(event)
		if (handlers) {
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
				logBermuda('info', `Hook removed: ${event}`)
			}
		}
	}

	async trigger(event: string, ...args: any[]): Promise<void> {
		const handlers = this.hooks.get(event)
		if (!handlers || handlers.length === 0) return

		this.logger?.debug({ event, argsCount: args.length }, 'Triggering hook')

		for (const handler of handlers) {
			try {
				await handler(...args)
			} catch (error) {
				logBermuda('error', `Hook error [${event}]: ${(error as Error).message}`)
				this.logger?.error({ event, error }, 'Hook execution failed')
			}
		}
	}

	use(middleware: Middleware): void {
		this.middlewares.push(middleware)
		logBermuda('info', `Middleware registered (Total: ${this.middlewares.length})`)
	}

	async executeMiddlewares(context: MiddlewareContext): Promise<void> {
		let index = 0

		const next = async (): Promise<void> => {
			if (index >= this.middlewares.length) return

			const middleware = this.middlewares[index++]
			try {
				await middleware(context, next)
			} catch (error) {
				logBermuda('error', `Middleware error: ${(error as Error).message}`)
				this.logger?.error({ error, middlewareIndex: index - 1 }, 'Middleware execution failed')
				throw error
			}
		}

		await next()
	}

	clear(): void {
		this.hooks.clear()
		this.middlewares = []
		logBermuda('info', 'All hooks and middlewares cleared')
	}

	getHookCount(event?: string): number {
		if (event) {
			return this.hooks.get(event)?.length || 0
		}
		return Array.from(this.hooks.values()).reduce((sum, handlers) => sum + handlers.length, 0)
	}

	getMiddlewareCount(): number {
		return this.middlewares.length
	}
}
