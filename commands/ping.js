global.cmd({
    pattern: ".ping",
    alias: [".speed", ".pong"],
    desc: "Check bot speed",
    category: "main",
    react: "🏓",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, channelInfo, botname, power }) => {

    try {
        const start = Date.now()
        await conn.sendMessage(from, { text: "🏓 Pinging..." }, { quoted: mek })
        const end = Date.now()
        const speed = end - start
        const uptime = process.uptime().toFixed(0)
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)

        let response = `╭━━━〔 🏓 PING STATUS 〕━━━╮
┃ ⚡ Speed   : ${speed} ms
┃ ⏱️ Uptime  : ${uptime}s
┃ 💾 RAM     : ${ram} MB
╰━━━━━━━━━━━━━━━━━━━━━━━╯

✅ Bot is running smoothly!

${power}`

        await conn.sendMessage(from, { text: response }, { quoted: mek })

    } catch (e) {
        console.log(e)
    }
})
