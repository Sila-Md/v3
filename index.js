/*
   ╔══════════════════════════════════════╗
   ║       🤖 MYTHIC BOT - MD           ║
   ║    Developed by Sila               ║
   ║    +255 637 351 031                ║
   ║    YouTube: silatrix22             ║
   ║    GitHub: github.com/Sila-Md      ║
   ║    Channel: whatsapp.com/channel/  ║
   ║    0029VbBG4gfISTkCpKxyMH02       ║
   ╚══════════════════════════════════════╝
*/

require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const axios = require('axios')
const PhoneNumber = require('awesome-phonenumber')
const pino = require('pino')
const readline = require('readline')
const NodeCache = require('node-cache')

// ═══════════════════════════════════════
// 📦 IMPORT BAILEYS (CommonJS)
// ═══════════════════════════════════════
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    proto,
    getContentType
} = require("@whiskeysockets/baileys")

// ═══════════════════════════════════════
// 🌐 EXPORT TO GLOBAL FOR MYFUNC
// ═══════════════════════════════════════
global.baileysProto = proto
global.baileysDelay = delay
global.baileysGetContentType = getContentType

// ═══════════════════════════════════════
// 📁 LOAD MYFUNC (AFTER GLOBAL IS SET)
// ═══════════════════════════════════════
const { 
    smsg, 
    isUrl, 
    generateMessageTag, 
    getBuffer, 
    getSizeMedia, 
    fetch, 
    sleep, 
    reSize,
    fetchBuffer
} = require('./lib/myfunc')

const { rmSync } = require('fs')

// ═══════════════════════════════════════
// 🧠 LIGHTWEIGHT STORE
// ═══════════════════════════════════════
const store = require('./lib/lightweight_store')
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// ═══════════════════════════════════════
// 🧹 GARBAGE COLLECTION
// ═══════════════════════════════════════
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000)

// ═══════════════════════════════════════
// 📊 MEMORY MONITOR
// ═══════════════════════════════════════
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 500) {
        console.log(chalk.red(`⚠️ RAM too high (>500MB = ${used.toFixed(0)}MB), restarting...`))
        process.exit(1)
    }
}, 30_000)

// ═══════════════════════════════════════
// 🌐 GLOBAL BOT INFO
// ═══════════════════════════════════════
global.botname = "𝐌𝐘𝐓𝐇𝐈𝐂 𝐁𝐎𝐓"
global.botdev = "Sila"
global.botnumber = "255637351031"
global.botjid = "120363402325089913@newsletter"
global.botchannel = "https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02"
global.botgithub = "https://github.com/Sila-Md"
global.botyoutube = "silatrix22"
global.botimage = "https://i.ibb.co/7tR0mcqL/file-000000004fa0720c93949d4309122992.png"
global.power = "𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡"
global.themeemoji = "•"
global.packname = settings.packname || "MYTHIC BOT"
global.author = settings.author || "Sila"
global.owner = JSON.parse(fs.readFileSync('./data/owner.json'))

// ═══════════════════════════════════════
// 🎯 COMMAND REGISTRY SYSTEM
// ═══════════════════════════════════════
global.cmdList = []

global.cmd = function(info, func) {
    let data = {
        pattern: info.pattern,
        alias: info.alias || [],
        desc: info.desc || '',
        category: info.category || 'misc',
        react: info.react || '🤖',
        filename: info.filename || 'Not Provided',
        fromMe: info.fromMe || false,
        isOwner: info.isOwner || false,
        isGroup: info.isGroup || false,
        isAdmin: info.isAdmin || false,
        function: func
    }
    global.cmdList.push(data)
    return data
}

// ═══════════════════════════════════════
// 📝 CONNECTION SETUP
// ═══════════════════════════════════════
const pairingCode = process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY 
    ? readline.createInterface({ input: process.stdin, output: process.stdout }) 
    : null

const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        return Promise.resolve(settings.ownerNumber || "255637351031")
    }
}

// ═══════════════════════════════════════
// 🔗 CHANNEL INFO
// ═══════════════════════════════════════
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: global.botjid,
            newsletterName: '𝐌𝐘𝐓𝐇𝐈𝐂 𝐁𝐎𝐓',
            serverMessageId: -1
        }
    }
}

// ═══════════════════════════════════════
// 🤖 PROCESS MESSAGE
// ═══════════════════════════════════════
async function processMessage(conn, m, mek) {
    try {
        const chatId = mek.key.remoteJid
        const senderId = mek.key.participant || mek.key.remoteJid
        const isGroup = chatId.endsWith('@g.us')
        
        const userMessage = (
            mek.message?.conversation?.trim() ||
            mek.message?.extendedTextMessage?.text?.trim() ||
            mek.message?.imageMessage?.caption?.trim() ||
            mek.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim()

        const rawText = (
            mek.message?.conversation?.trim() ||
            mek.message?.extendedTextMessage?.text?.trim() ||
            mek.message?.imageMessage?.caption?.trim() ||
            mek.message?.videoMessage?.caption?.trim() ||
            ''
        )

        if (!userMessage.startsWith('.')) return

        const args = rawText.trim().split(/\s+/)
        const commandName = args[0].toLowerCase()
        const commandArgs = args.slice(1).join(' ')

        const cmdConfig = global.cmdList.find(cmd => {
            if (cmd.pattern === commandName) return true
            if (cmd.alias && cmd.alias.includes(commandName)) return true
            return false
        })

        if (cmdConfig && cmdConfig.function) {
            if (cmdConfig.isOwner) {
                const ownerJids = global.owner.map(o => o + '@s.whatsapp.net')
                if (!ownerJids.includes(senderId) && !mek.key.fromMe) {
                    await conn.sendMessage(chatId, { 
                        text: '❌ This command is only for the bot owner!',
                        ...channelInfo 
                    }, { quoted: mek })
                    return
                }
            }

            if (cmdConfig.isGroup && !isGroup) {
                await conn.sendMessage(chatId, { 
                    text: '❌ This command can only be used in groups!',
                    ...channelInfo 
                }, { quoted: mek })
                return
            }

            await cmdConfig.function(conn, mek, m, { 
                from: chatId, 
                sender: senderId,
                isGroup: isGroup,
                args: commandArgs,
                commandName: commandName,
                channelInfo: channelInfo,
                botname: global.botname,
                botdev: global.botdev,
                botimage: global.botimage,
                botchannel: global.botchannel,
                botnumber: global.botnumber,
                botgithub: global.botgithub,
                botyoutube: global.botyoutube,
                power: global.power
            })
        }

    } catch (err) {
        console.error(chalk.red('Error processing command:'), err)
    }
}

// ═══════════════════════════════════════
// 🟢 START BOT
// ═══════════════════════════════════════
async function startMythicBot() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const conn = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        conn.ev.on('creds.update', saveCreds)
        store.bind(conn.ev)

        conn.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        conn.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = conn.decodeJid(contact.id)
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })

        conn.getName = (jid, withoutContact = false) => {
            let id = conn.decodeJid(jid)
            withoutContact = conn.withoutContact || withoutContact
            let v
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === conn.decodeJid(conn.user.id) ?
                conn.user :
                (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        conn.public = true
        conn.serializeM = (m) => smsg(conn, m, store)

        // ═══════════════════════════════
        // 📨 MESSAGES
        // ═══════════════════════════════
        conn.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message

                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
    // Handle auto status view
    if (global.handleStatusUpdate) {
        global.handleStatusUpdate(conn, chatUpdate).catch(() => {})
    }
    return
}
                if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return

                if (conn?.msgRetryCounterCache) {
                    conn.msgRetryCounterCache.clear()
                }

                const m = smsg(conn, mek, store)
                await processMessage(conn, m, mek)

            } catch (err) {
                console.error(chalk.red("Error in messages.upsert:"), err)
            }
        })

        // ═══════════════════════════════
        // 📞 ANTICALL
        // ═══════════════════════════════
        const antiCallNotified = new Set()
        
        conn.ev.on('call', async (calls) => {
            try {
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId
                    if (!callerJid) continue
                    
                    try {
                        if (typeof conn.rejectCall === 'function' && call.id) {
                            await conn.rejectCall(call.id, callerJid)
                        }
                    } catch {}
                    
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid)
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000)
                        await conn.sendMessage(callerJid, { 
                            text: '📵 Anticall is enabled. Your call was rejected.' 
                        })
                    }
                    
                    setTimeout(async () => {
                        try { await conn.updateBlockStatus(callerJid, 'block') } catch {}
                    }, 800)
                }
            } catch {}
        })

        // ═══════════════════════════════
        // 👥 GROUP PARTICIPANTS
        // ═══════════════════════════════
        conn.ev.on('group-participants.update', async (update) => {
            try {
                const { id, participants, action } = update
                if (!id.endsWith('@g.us')) return

                if (action === 'add') {
                    for (const participant of participants) {
                        const welcomeMsg = `╭━━━〔 👋 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 〕━━━╮\n┃ @${participant.split('@')[0]}\n┃ Welcome to the group!\n┃ Enjoy your stay! 🎉\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n${global.power}`
                        await conn.sendMessage(id, { 
                            text: welcomeMsg,
                            mentions: [participant],
                            ...channelInfo
                        })
                    }
                }

                if (action === 'remove') {
                    for (const participant of participants) {
                        const goodbyeMsg = `╭━━━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━━━╮\n┃ @${participant.split('@')[0]}\n┃ Has left the group\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n${global.power}`
                        await conn.sendMessage(id, { 
                            text: goodbyeMsg,
                            mentions: [participant],
                            ...channelInfo
                        })
                    }
                }
            } catch (err) {
                console.error(chalk.red('Error in group update:'), err)
            }
        })

        // ═══════════════════════════════
        // 📱 PAIRING CODE
        // ═══════════════════════════════
        if (pairingCode && !conn.authState.creds.registered) {
            if (useMobile) throw new Error('Cannot use pairing code with mobile api')

            let phoneNumber = global.botnumber.replace(/[^0-9]/g, '')

            const pn = PhoneNumber('+' + phoneNumber)
            if (!pn.isValid()) {
                console.log(chalk.red('Invalid phone number.'))
                process.exit(1)
            }

            setTimeout(async () => {
                try {
                    let code = await conn.requestPairingCode(phoneNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`Your Pairing Code: `)), chalk.black(chalk.white(code)))
                } catch (error) {
                    console.error(chalk.red('Error requesting pairing code:'), error)
                }
            }, 3000)
        }

        // ═══════════════════════════════
        // 🔌 CONNECTION UPDATE
        // ═══════════════════════════════
        conn.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s
            
            if (qr) console.log(chalk.yellow('📱 QR Code generated.'))
            if (connection === 'connecting') console.log(chalk.yellow('🔄 Connecting...'))
            
            if (connection == "open") {
                console.log(chalk.magenta(`\n`))
                console.log(chalk.yellow(`🌿 Connected => ${JSON.stringify(conn.user, null, 2)}`))

                try {
                    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'
                    await conn.sendMessage(botNumber, {
                        text: `╭━━━〔 🤖 𝐌𝐘𝐓𝐇𝐈𝐂 𝐁𝐎𝐓 〕━━━╮\n┃ ✅ Connected Successfully!\n┃ ⏰ ${new Date().toLocaleString()}\n┃ 👤 Owner: ${global.botdev}\n┃ 📞 ${global.botnumber}\n┃ 📺 ${global.botyoutube}\n┃ 🔗 ${global.botchannel}\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n${global.power}`,
                        ...channelInfo
                    })
                } catch (error) {
                    console.error(chalk.red('Error sending connection message:'), error.message)
                }

                await delay(1999)
                console.log(chalk.yellow(`\n\n              ${chalk.bold.blue(`[ ${global.botname} ]`)}\n\n`))
                console.log(chalk.cyan(`< ================================================== >`))
                console.log(chalk.magenta(`\n${global.themeemoji} 𝐁𝐎𝐓: ${global.botname}`))
                console.log(chalk.magenta(`${global.themeemoji} 𝐃𝐄𝐕: ${global.botdev}`))
                console.log(chalk.magenta(`${global.themeemoji} 𝐘𝐎𝐔𝐓𝐔𝐁𝐄: ${global.botyoutube}`))
                console.log(chalk.magenta(`${global.themeemoji} 𝐆𝐈𝐓𝐇𝐔𝐁: ${global.botgithub}`))
                console.log(chalk.green(`${global.themeemoji} 🤖 Bot Connected! ✅`))
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut
                
                console.log(chalk.red(`Connection closed, reconnecting ${shouldReconnect}`))
                
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try {
                        rmSync('./session', { recursive: true, force: true })
                        console.log(chalk.yellow('Session deleted.'))
                    } catch (error) {
                        console.error(chalk.red('Error deleting session:'), error)
                    }
                }
                
                if (shouldReconnect) {
                    await delay(5000)
                    startMythicBot()
                }
            }
        })

        return conn

    } catch (error) {
        console.error(chalk.red('Error in startMythicBot:'), error)
        await delay(5000)
        startMythicBot()
    }
}

// ═══════════════════════════════════════
// ⚡ LOAD COMMANDS
// ═══════════════════════════════════════
function loadCommands() {
    const commandsDir = path.join(__dirname, 'commands')
    
    if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true })
        console.log(chalk.yellow('📁 Created commands folder'))
        return
    }

    const loadCommandsRecursive = (dir) => {
        const files = fs.readdirSync(dir)
        for (const file of files) {
            const fullPath = path.join(dir, file)
            const stat = fs.statSync(fullPath)
            
            if (stat.isDirectory()) {
                loadCommandsRecursive(fullPath)
            } else if (file.endsWith('.js')) {
                try {
                    require(fullPath)
                    console.log(chalk.green(`✅ Loaded: ${file}`))
                } catch (err) {
                    console.error(chalk.red(`❌ Failed to load ${file}:`), err.message)
                }
            }
        }
    }

    loadCommandsRecursive(commandsDir)
    console.log(chalk.cyan(`\n📦 Total commands loaded: ${global.cmdList.length}\n`))
}

// ═══════════════════════════════════════
// 🚀 START
// ═══════════════════════════════════════
loadCommands()
startMythicBot().catch(error => {
    console.error(chalk.red('Fatal error:'), error)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err)
})

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled Rejection:'), err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})