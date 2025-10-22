import type { Logger } from 'pino'
import { logBermuda } from './banner'

export interface MediaUploadOptions {
	maxRetries?: number
	retryDelay?: number
	onProgress?: (progress: number) => void
	compress?: boolean
	quality?: number
}

export interface MediaDownloadOptions {
	maxRetries?: number
	retryDelay?: number
	onProgress?: (progress: number) => void
	timeout?: number
}

export class MediaHandler {
	private logger?: Logger
	private uploadProgress: Map<string, number> = new Map()
	private downloadProgress: Map<string, number> = new Map()

	constructor(logger?: Logger) {
		this.logger = logger
	}

	async uploadWithRetry(
		uploadFn: () => Promise<any>,
		options: MediaUploadOptions = {}
	): Promise<any> {
		const maxRetries = options.maxRetries || 3
		const retryDelay = options.retryDelay || 2000
		let attempt = 0

		while (attempt < maxRetries) {
			try {
				logBermuda('info', `Uploading media (Attempt ${attempt + 1}/${maxRetries})`)
				
				const result = await uploadFn()
				
				logBermuda('success', 'Media uploaded successfully')
				this.logger?.info({ attempt: attempt + 1 }, 'Media upload successful')
				
				if (options.onProgress) {
					options.onProgress(100)
				}
				
				return result
			} catch (error) {
				attempt++
				
				if (attempt >= maxRetries) {
					logBermuda('error', `Media upload failed after ${maxRetries} attempts`)
					this.logger?.error({ error, attempts: maxRetries }, 'Media upload failed')
					throw error
				}
				
				logBermuda('warning', `Upload failed, retrying in ${retryDelay / 1000}s...`)
				await this.delay(retryDelay)
			}
		}
	}

	async downloadWithRetry(
		downloadFn: () => Promise<Buffer>,
		options: MediaDownloadOptions = {}
	): Promise<Buffer> {
		const maxRetries = options.maxRetries || 3
		const retryDelay = options.retryDelay || 2000
		let attempt = 0

		while (attempt < maxRetries) {
			try {
				logBermuda('info', `Downloading media (Attempt ${attempt + 1}/${maxRetries})`)
				
				const result = await this.withTimeout(
					downloadFn(),
					options.timeout || 30000
				)
				
				logBermuda('success', `Media downloaded (${this.formatBytes(result.length)})`)
				this.logger?.info({ attempt: attempt + 1, size: result.length }, 'Media download successful')
				
				if (options.onProgress) {
					options.onProgress(100)
				}
				
				return result
			} catch (error) {
				attempt++
				
				if (attempt >= maxRetries) {
					logBermuda('error', `Media download failed after ${maxRetries} attempts`)
					this.logger?.error({ error, attempts: maxRetries }, 'Media download failed')
					throw error
				}
				
				logBermuda('warning', `Download failed, retrying in ${retryDelay / 1000}s...`)
				await this.delay(retryDelay)
			}
		}

		throw new Error('Media download failed')
	}

	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(() => reject(new Error('Download timeout')), timeoutMs)
			)
		])
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes'

		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	trackUploadProgress(id: string, progress: number): void {
		this.uploadProgress.set(id, progress)
		
		if (progress % 20 === 0) {
			logBermuda('info', `Upload progress [${id}]: ${progress}%`)
		}
	}

	trackDownloadProgress(id: string, progress: number): void {
		this.downloadProgress.set(id, progress)
		
		if (progress % 20 === 0) {
			logBermuda('info', `Download progress [${id}]: ${progress}%`)
		}
	}

	getUploadProgress(id: string): number {
		return this.uploadProgress.get(id) || 0
	}

	getDownloadProgress(id: string): number {
		return this.downloadProgress.get(id) || 0
	}

	clearProgress(id: string): void {
		this.uploadProgress.delete(id)
		this.downloadProgress.delete(id)
	}
}
