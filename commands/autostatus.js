// ═══════════════════════════════════════
// 📱 AUTO STATUS COMMAND
// ═══════════════════════════════════════

const fs = require('fs');
const path = require('path');

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    if (!fs.existsSync(path.join(__dirname, '../data'))) {
        fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

// ═══════════════════════════════════════
// 📌 REGISTER COMMAND
// ═══════════════════════════════════════
global.cmd({
    pattern: ".autostatus",
    alias: [".autostatusview", ".statusview"],
    desc: "Enable/Disable auto status view & reactions",
    category: "owner",
    react: "📱",
    filename: __filename,
    isOwner: true
},
async (conn, mek, m, { from, args, channelInfo, power }) => {

    try {
        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        const subCommand = args?.trim().split(/\s+/)[0]?.toLowerCase();
        const subArg = args?.trim().split(/\s+/)[1]?.toLowerCase();

        // If no arguments, show current status
        if (!subCommand) {
            const status = config.enabled ? '✅ Enabled' : '❌ Disabled';
            const reactStatus = config.reactOn ? '✅ Enabled' : '❌ Disabled';
            
            let text = `╭━━━〔 📱 𝐀𝐔𝐓𝐎 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━━╮
┃ 📊 Status View  : ${status}
┃ 💫 Reactions    : ${reactStatus}
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 *Commands:*
➤ .autostatus on
➤ .autostatus off
➤ .autostatus react on
➤ .autostatus react off

${power}`;

            await conn.sendMessage(from, { text: text, ...channelInfo }, { quoted: mek });
            return;
        }

        // Handle on/off
        if (subCommand === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            await conn.sendMessage(from, { 
                text: `✅ Auto status view has been enabled!\nBot will now automatically view all contact statuses.\n\n${power}`,
                ...channelInfo 
            }, { quoted: mek });
        } 
        else if (subCommand === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            await conn.sendMessage(from, { 
                text: `❌ Auto status view has been disabled!\nBot will no longer automatically view statuses.\n\n${power}`,
                ...channelInfo 
            }, { quoted: mek });
        } 
        else if (subCommand === 'react') {
            if (!subArg || (subArg !== 'on' && subArg !== 'off')) {
                await conn.sendMessage(from, { 
                    text: `❌ Please specify on/off!\nUse: .autostatus react on\nUse: .autostatus react off\n\n${power}`,
                    ...channelInfo 
                }, { quoted: mek });
                return;
            }
            
            if (subArg === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                await conn.sendMessage(from, { 
                    text: `💫 Status reactions have been enabled!\nBot will now react 💚 to status updates.\n\n${power}`,
                    ...channelInfo 
                }, { quoted: mek });
            } else {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                await conn.sendMessage(from, { 
                    text: `❌ Status reactions have been disabled!\nBot will no longer react to status updates.\n\n${power}`,
                    ...channelInfo 
                }, { quoted: mek });
            }
        } 
        else {
            await conn.sendMessage(from, { 
                text: `❌ Invalid option!\n\nUse:\n.autostatus on/off\n.autostatus react on/off\n\n${power}`,
                ...channelInfo 
            }, { quoted: mek });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await conn.sendMessage(from, { 
            text: `❌ Error: ${error.message}\n\n${power}`,
            ...channelInfo 
        }, { quoted: mek });
    }
});

// ═══════════════════════════════════════
// 📌 HELPER FUNCTIONS
// ═══════════════════════════════════════

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        if (!fs.existsSync(configPath)) return false;
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled || false;
    } catch (error) {
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        if (!fs.existsSync(configPath)) return false;
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn || false;
    } catch (error) {
        return false;
    }
}

// Function to react to status
async function reactToStatus(conn, statusKey) {
    try {
        if (!isStatusReactionEnabled()) return;

        await conn.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {
        // Silent fail for rate limits
        if (!error.message?.includes('rate-overlimit')) {
            console.error('❌ Error reacting to status:', error.message);
        }
    }
}

// Function to handle status updates (call this from index.js)
async function handleStatusUpdate(conn, status) {
    try {
        if (!isAutoStatusEnabled()) return;

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await conn.readMessages([msg.key]);
                    await reactToStatus(conn, msg.key);
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await conn.readMessages([msg.key]);
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await conn.readMessages([status.key]);
                await reactToStatus(conn, status.key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await conn.readMessages([status.key]);
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key?.remoteJid === 'status@broadcast') {
            try {
                await conn.readMessages([status.reaction.key]);
                await reactToStatus(conn, status.reaction.key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await conn.readMessages([status.reaction.key]);
                }
            }
            return;
        }

    } catch (error) {
        if (!error.message?.includes('rate-overlimit')) {
            console.error('❌ Error in auto status view:', error.message);
        }
    }
}

// ═══════════════════════════════════════
// 📌 EXPORT HANDLER FOR INDEX.JS
// ═══════════════════════════════════════
global.handleStatusUpdate = handleStatusUpdate;