global.cmd({
    pattern: ".menu",
    alias: [".help", ".list", ".cmds", ".commands"],
    desc: "Show bot menu",
    category: "main",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, channelInfo, botname, botdev, botimage, power }) => {

    try {
        let menu = `╭━━━〔 🤖 ${botname} 〕━━━╮
┃ 👤 Owner: ${botdev}
┃ ⏰ ${new Date().toLocaleString()}
╰━━━━━━━━━━━━━━━━━━━━━╯

╭───〔 📋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 〕───╮`

        // Group commands by category
        const categories = {}
        global.cmdList.forEach(cmd => {
            if (cmd.dontAddCommandList) return
            if (!categories[cmd.category]) categories[cmd.category] = []
            categories[cmd.category].push(cmd.pattern)
        })

        for (const [category, cmds] of Object.entries(categories)) {
            menu += `\n┃\n┃ ⚡ *${category.toUpperCase()}*\n┃ ${cmds.join(', ')}`
        }

        menu += `\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n${power}`

        await conn.sendMessage(from, { 
            image: { url: botimage },
            caption: menu,
            ...channelInfo
        }, { quoted: mek })

    } catch (e) {
        console.log(e)
    }
})