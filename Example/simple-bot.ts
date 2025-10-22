import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '../src'

async function startSimpleBot() {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info_simple')

	const sock = makeWASocket({
		auth: state,
		printQRInTerminal: true
	})

	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update

		if(connection === 'close') {
			const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut
			
			console.log('Connection closed. Reconnecting:', shouldReconnect)

			if(shouldReconnect) {
				startSimpleBot()
			}
		} else if(connection === 'open') {
			console.log('✅ Connected successfully! Send messages to test.')
		}
	})

	sock.ev.on('messages.upsert', async (m) => {
		const msg = m.messages[0]
		
		if(!msg.message || msg.key.fromMe) return

		const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
		const from = msg.key.remoteJid!

		console.log(`Received from ${from}: ${messageText}`)

		if(messageText.toLowerCase() === 'hello') {
			await sock.sendMessage(from, { 
				text: '👋 Hello! I am a BERMUDA Bot powered by enhanced Baileys library!' 
			})
		}

		else if(messageText.toLowerCase() === 'ping') {
			await sock.sendMessage(from, { 
				text: '🏓 Pong!' 
			})
		}
	})

	console.log('Bot is starting...')
}

startSimpleBot().catch(err => {
	console.error('Error:', err)
})
