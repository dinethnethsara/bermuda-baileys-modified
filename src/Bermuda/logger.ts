import chalk from 'chalk'
import type { Logger } from 'pino'

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface BermudaLoggerConfig {
	level?: LogLevel
	enableColors?: boolean
	enableTimestamp?: boolean
	enablePrefix?: boolean
	customPrefix?: string
}

export class BermudaLogger {
	private config: Required<BermudaLoggerConfig>
	private pinoLogger?: Logger

	constructor(config: BermudaLoggerConfig = {}, pinoLogger?: Logger) {
		this.config = {
			level: config.level || 'info',
			enableColors: config.enableColors !== false,
			enableTimestamp: config.enableTimestamp !== false,
			enablePrefix: config.enablePrefix !== false,
			customPrefix: config.customPrefix || 'BERMUDA'
		}
		this.pinoLogger = pinoLogger
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
		const currentLevelIndex = levels.indexOf(this.config.level)
		const messageLevelIndex = levels.indexOf(level)
		return messageLevelIndex >= currentLevelIndex
	}

	private formatMessage(level: LogLevel, message: string): string {
		let formatted = ''

		if (this.config.enableTimestamp) {
			const timestamp = new Date().toISOString()
			formatted += chalk.gray(`[${timestamp}] `)
		}

		if (this.config.enablePrefix) {
			formatted += chalk.magenta(`[${this.config.customPrefix}] `)
		}

		const levelColors: Record<LogLevel, any> = {
			trace: chalk.gray,
			debug: chalk.blue,
			info: chalk.cyan,
			warn: chalk.yellow,
			error: chalk.red,
			fatal: chalk.bgRed.white
		}

		if (this.config.enableColors) {
			formatted += levelColors[level](`[${level.toUpperCase()}] `) + message
		} else {
			formatted += `[${level.toUpperCase()}] ` + message
		}

		return formatted
	}

	trace(message: string, data?: any): void {
		if (!this.shouldLog('trace')) return
		console.log(this.formatMessage('trace', message))
		if (data && this.pinoLogger) this.pinoLogger.trace(data, message)
	}

	debug(message: string, data?: any): void {
		if (!this.shouldLog('debug')) return
		console.log(this.formatMessage('debug', message))
		if (data && this.pinoLogger) this.pinoLogger.debug(data, message)
	}

	info(message: string, data?: any): void {
		if (!this.shouldLog('info')) return
		console.log(this.formatMessage('info', message))
		if (data && this.pinoLogger) this.pinoLogger.info(data, message)
	}

	warn(message: string, data?: any): void {
		if (!this.shouldLog('warn')) return
		console.log(this.formatMessage('warn', message))
		if (data && this.pinoLogger) this.pinoLogger.warn(data, message)
	}

	error(message: string, data?: any): void {
		if (!this.shouldLog('error')) return
		console.log(this.formatMessage('error', message))
		if (data && this.pinoLogger) this.pinoLogger.error(data, message)
	}

	fatal(message: string, data?: any): void {
		if (!this.shouldLog('fatal')) return
		console.log(this.formatMessage('fatal', message))
		if (data && this.pinoLogger) this.pinoLogger.fatal(data, message)
	}

	setLevel(level: LogLevel): void {
		this.config.level = level
		this.info(`Log level changed to: ${level}`)
	}

	getLevel(): LogLevel {
		return this.config.level
	}
}
