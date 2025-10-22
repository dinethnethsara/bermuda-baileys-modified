import chalk from 'chalk'
import gradient from 'gradient-string'

export const showBanner = () => {
	const bermudaGradient = gradient(['#FF0080', '#FF8C00', '#FFD700', '#00FF00', '#00CED1', '#0080FF', '#8B00FF'])
	
	const banner = `
╔═══════════════════════════════════════════════════════════╗
║              🌴 BERMUDA CYBER FAMILY 🌴                   ║
║           Modified Enhanced WhatsApp Library             ║
║         Powered By BERMUDA Cyber Family © 2025           ║
╚═══════════════════════════════════════════════════════════╝
`

	console.log(bermudaGradient.multiline(banner))
}

export const logBermuda = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
	const prefix = gradient.rainbow('【BERMUDA】')
	
	switch (level) {
	case 'info':
		console.log(prefix, chalk.blue('ℹ'), message)
		break
	case 'success':
		console.log(prefix, chalk.green('✓'), message)
		break
	case 'warning':
		console.log(prefix, chalk.yellow('⚠'), message)
		break
	case 'error':
		console.log(prefix, chalk.red('✗'), message)
		break
	}
}
