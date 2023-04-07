const {Bot, InlineKeyboard} = require('grammy');
const {ConversationUpdateHandler} = require('./core/core');
const convHandler = require('./core/convHandler');
const bot = new Bot("5893728240:AAHqOxXn1T7MSlq3kA76VARNvZG7UYeFa8o");


bot.on('message:text', async (ctx, next) => {
    await reply(ctx)
})

bot.on('callback_query:data', async (ctx, next) => {
    await reply(ctx)
})

async function reply(ctx) {



    let cbQuery = ctx.callbackQuery ? ctx.callbackQuery.data : null
    let message = ctx.msg ? ctx.msg.text : null

    await ConversationUpdateHandler('telegram_id', ctx.chat.id, message, cbQuery, async (reply_text, buttons) => {
        let keyboard = new InlineKeyboard()
        if(buttons) {
            buttons.forEach((button) => {
                if(!button.row) {
                    keyboard.text(button.text, button.id)
                } else {
                    keyboard.row()
                }
            })
        }
        await ctx.reply(reply_text, {reply_markup: keyboard})
    })
}

bot.start()
