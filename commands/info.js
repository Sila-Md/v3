global.cmd({
    pattern: ".info",
    alias: [".botinfo", ".about"],
    desc: "Bot information",
    category: "main",
    react: "ℹ️",
    filename: __filename
},
async (conn, mek, m, { from, channelInfo, botname, botdev, botnumber, botgithub, botyoutube, botchannel, botimage, power }) => {

    try {
        const uptime = process.uptime()
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)

        let info = `╭━━━〔 🤖 ${botname} 〕━━━╮
┃
┃ 👤 *Developer:* ${botdev}
┃ 📞 *Number:* ${botnumber}
┃ 📺 *YouTube:* ${botyoutube}
┃ 🔗 *GitHub:* ${botgithub}
┃ 📢 *Channel:* ${botchannel}
┃
┃ ⏱️ *Uptime:* ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s
┃ 💾 *RAM:* ${ram} MB
┃ 📦 *Commands:* ${global.cmdList.length}
┃
╰━━━━━━━━━━━━━━━━━━━━━╯

${power}`

        await conn.sendMessage(from, { 
            image: { url: botimage },
            caption: info,
            ...channelInfo
        }, { quoted: mek })

    } catch (e) {
        console.log(e)
    }
})