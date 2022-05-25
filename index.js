const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { parse } = require('dotenv');
require('dotenv').config();
const { TicTacToe } = require('./databaseObjects.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('Ready!');
})

client.on('messageCreate', (message) => {
    if(message.author.id === client.user.id)
        return;
    else if(message.content === 'ping') {
        message.reply('pong');
    }
})



let EMPTY = Symbol('empty');
let PLAYER = Symbol('player');
let BOT = Symbol('bot');
let tictactoe_state;

function makeGrid() {
    components = []

    for(let row = 0; row < 3; row++) {
        actionRow = new MessageActionRow()

        for(let col = 0; col < 3; col++) {
            messageButton = new MessageButton()
                .setCustomId('tictactoe_' + row + '_' + col)

            switch(tictactoe_state[row][col]) {
                case EMPTY: 
                    messageButton
                        .setLabel(' ')
                        .setStyle('SECONDARY')
                    break;
                case PLAYER:
                    messageButton
                        .setLabel('X')
                        .setStyle('PRIMARY')
                    break;
                case BOT:
                    messageButton
                        .setLabel('O')
                        .setStyle('DANGER')
                    break;
            }
            actionRow.addComponents(messageButton)
        }
        components.push(actionRow)
    }
    return components
}

function getRandomNum(max) {
    return Math.floor(Math.random() * max);
}

function isDraw() {
    for(let row = 0; row < 3; row++) {
        for(let col = 0; col < 3; col++) {
            if(tictactoe_state[row][col] == EMPTY) {
                return false;
            }
        }
    }
    return true;
}

function isGameOver() {
    for(let i = 0; i < 3; i++) {
        if((tictactoe_state[i][0] == tictactoe_state[i][1] && tictactoe_state[i][1] == tictactoe_state[i][2]) && tictactoe_state[i][2] != EMPTY) {
            return true;
        }
        if((tictactoe_state[0][i] == tictactoe_state[1][i] && tictactoe_state[1][i] == tictactoe_state[2][i]) && tictactoe_state[2][i] != EMPTY) {
            return true;
        }
    }
    if(tictactoe_state[1][1] != EMPTY) {
        if(
            (tictactoe_state[0][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[2][2]) || 
            (tictactoe_state[2][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[0][2])) {
            return true;
        }
    }
    return false;
}

client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) 
        return;
    if(!interaction.customId.startsWith('tictactoe'))
        return;

    parsedFields = interaction.customId.split('_');
    let row = parsedFields[1];
    let col = parsedFields[2];

    if(tictactoe_state[row][col] != EMPTY) {
        interaction.update({
            content: "You can't select that position",
            components: makeGrid()
        })
        return;
    }

    tictactoe_state[row][col] = PLAYER;
    console.log(tictactoe_state);

    if(isGameOver()) {
        let user = await TicTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });
        if (!user) {
            user = await TicTacToe.create({ user_id: interaction.user.id })
        }

        await user.increment('score');

        interaction.update({
            content: 'YOU WIN! You have now won ' + (user.get('score') + 1) + ' time(s)',
            components: []
        })
        return;
    }
    if(isDraw()) {
        interaction.update({
            content: 'DRAW!',
            components: []
        })
        return;
    }
    
    let botRow;
    let botCol;
    do {
        botRow = getRandomNum(3);
        botCol = getRandomNum(3);
    } while(tictactoe_state[botRow][botCol] != EMPTY);

    tictactoe_state[botRow][botCol] = BOT;
    console.log(tictactoe_state);

    if(isGameOver()) {
        interaction.update({
            content: 'YOU LOSE!',
            components: []
        })
        return;
    }
    if(isDraw()) {
        interaction.update({
            content: 'DRAW!',
            components: []
        })
        return;
    }

    interaction.update({
        components: makeGrid()
    })
    
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand())
        return;
    const { commandName } = interaction;

    if(commandName === 'tictactoe') {
        

        tictactoe_state = [
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]
        ]

        await interaction.reply({ content: "Let's play a game of tic-tac-toe!", components: makeGrid() });
    }
})

client.login(process.env.KEY);