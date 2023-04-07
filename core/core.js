const {User, UserConversationStage} = require('./models');
const {conversationSwitch} = require('./conversations');
const {callback} = require('pg/lib/native/query');
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const ruLocale = require('dayjs/locale/ru')
const {logCore} = require('./logCore');

dayjs.extend(relativeTime)
dayjs.locale('ru')



const lc = new logCore()

//Главная функция которая проверяет регистрацию пользователя и обрабатывает сообщения
async function ConversationUpdateHandler(db_id_type, user_id, message_text, button_value, callback) {
    try {
        const startTime = dayjs()

        lc.debug('Начинаю обработку сообщения', `db_id_type: "${db_id_type}" user_id: "${user_id}" message_text: "${message_text}" button_value: "${button_value}" callback: "${!!callback}"`)
        //Ищем пользователя
        let user = await User.findOne({where: {[db_id_type]: user_id}})

        //Проверяем в базе
        if (!user) {
            lc.debug('Пользователь не нашелся в базе, создаю нового')
            //Если нет то создаём нового
            const newUser = await User.build({
                [db_id_type]: user_id
            })
            await newUser.save()
            //Присваиваем переменной нового пользователя
            lc.debug(`newUser:`, newUser)
            lc.debug(`user:`, user)
            user = await User.findOne({where: {[db_id_type]: user_id}})
        } else {
            lc.debug('Пользователь нашелся в базе, действий не предпринято')
        }
        const conversationObject = conversationSwitch(user.status)
        lc.debug(`user.status: ${user.status}, conversationObject: ${!!conversationObject}`)
        //Получаем его этап общения и шаг
        let userStage = await user.getUserConversationStage()

        //Если в базе не числится отслеживание этапов создаём
        if (!userStage) {
            userStage = await user.createUserConversationStage({})
            lc.debug(`userStage в базе не нашлось, создал новый:`, userStage)
        } else {
            //Проверка валидности стейджа и шага
            if(!await checkStepAndStage(conversationObject, userStage.id, userStage.step, userStage.stage, callback)) {
                userStage = await user.getUserConversationStage()
                lc.debug(`валидность userStage не пройдена, получил новый, id: ${userStage.id} stage: ${userStage.stage} step: ${userStage.step}`)
            } else {
                lc.debug(`валидность userStage пройдена, id: ${userStage.id} stage: ${userStage.stage} step: ${userStage.step}`)
            }
        }

        lc.debug(`Передаю информацию в обработчик сообщений`)
        //Запускаем функцию обработки сообщения с собранными данными
        await proceedMessage(db_id_type, user_id, message_text, button_value, conversationObject, userStage.id, userStage.stage, userStage.step, callback)

        const endTime = dayjs()

        lc.debug(`Обработка обращения заняла ${endTime.diff(startTime, 'millisecond')}мс`)

    } catch (e) {
        console.error(`Ошибка до обработчика сообщений`, e)
        //TODO: сделать возврат ошибки и успешного выполнения задачи
    }
}

//Функция обработки самого сообщения и возврата callback
async function proceedMessage(db_id_type, user_id, message_text, button_value, conversationObject, dbStage_id, stage, step, callback) {
    //Сначала проверяем нажата ли кнопка, так как они в приоритете
    if (button_value) {
        lc.debug(`Обрабатываю события кнопок:`, button_value)
        const btnLogic = conversationObject[stage].steps[step].buttonsLogic
        //Проверяем что логика кнопок существует в этом шаге
        if (btnLogic && btnLogic[button_value]) {
            lc.debug(`логика кнопки нашлась`)
            //Выполняем всё что связанно с нажатием этой кнопки в шаге
            btnLogic[button_value].actions.map(async (action) => {
                await doAction(conversationObject, db_id_type, user_id, stage, null, dbStage_id, action, callback)
            })
        } else {
            lc.debug(`Логика кнопки не нашлась, ищем глобально`)
            //Если же кнопки нет в шаге, смотрим в этапе глобальные кнопки
            if(conversationObject[stage].globalButtonsLogic && conversationObject[stage].globalButtonsLogic[button_value]) {
                lc.debug(`Глобальные кнопки нашлись, обрабатываем`)
                //Выполняем всё что указано в глобальной кнопке
                conversationObject[stage].globalButtonsLogic[button_value].actions.map(async (action) => {
                    await doAction(conversationObject, db_id_type, user_id, stage, null, dbStage_id, action, callback)
                })
            } else {
                lc.debug(`Глобальные кнопки не нашлись отправляем ошибку`)
                //Если глобальная кнопка не нашлась, отправляем пользователю негодование
                await sendCallback('Вы нажали кнопку, которая не числится в системе, попробуйте еще раз', null, stage, callback, conversationObject)
            }
        }
        //Проверка на то что отправили текст
    } else if (message_text) {
        lc.debug(`Пользователь отправил текст`)
        const stepObject = conversationObject[stage].steps[step]

        //Проверяем что логика для текста существует в этом шаге
        if (stepObject.textLogic) {
            lc.debug(`Нашлась логика для текста, обрабатываем`)
            stepObject.textLogic.actions.map(async (action) => {
                await doAction(conversationObject, db_id_type, user_id, stage, message_text, dbStage_id, action, callback)
            })
        } else {
            lc.debug(`Логики для текста нет, отправляем дефолт`)
            //Логики для текста не нашлось, отправляем дефолт
            await sendCallback(conversationObject[stage].steps[step].text, conversationObject[stage].steps[step].buttons, stage, callback, conversationObject)
        }
    } else {
        lc.debug(`Это не кнопка и не текст, ошибку возвращаем`)
        //Ни текст ни кнопка, отправляем ошибку пользователю
        await sendCallback('Произошла ошибка с обработкой твоего обращения', null, stage, callback, conversationObject)
    }

}

//Магическая функция которая жуёт все стандартные действия, и отправляет ошибку пользователю если такого действия нет
async function doAction(conversationObject, db_id_type, user_id, stage, message_text, dbStage_id, action, callback) {
    switch (action.type) {
        case 'startFunction':
            lc.debug(`Запускаем функцию ${action.func}`)
            await action.func(message_text, db_id_type, user_id)
            break;
        case 'setStep':
            lc.debug(`Меняем шаг на ${action.value}`)
            await setStep(conversationObject, dbStage_id, stage, action.value, callback)
            break;
        case 'setStage':
            lc.debug(`Меняем этап на ${action.value}`)
            await setStage(conversationObject, dbStage_id, action.value, callback)
            break;
        case 'sendMessage':
            lc.debug(`Отправляем сообщение ${action.value}`)
            await sendCallback(action.value, action.buttons, stage, callback, conversationObject)
            break;
        default:
            await sendCallback('Действие не найдено', null, stage, callback, conversationObject)
            break;
    }
}

async function checkStepAndStage(conversationObject, dbStage_id, step, stage, callback) {
    if(!conversationObject[stage] || !conversationObject[stage].steps[step]) {
        await setStage(conversationObject, dbStage_id, stage, callback)
        return false
    } else {
        return true
    }
}

async function sendCallback(message, buttons, stage, callback, conversationObject) {
    let checkButtons = buttons
    if(!checkButtons) {
        checkButtons = conversationObject[stage].globalButtons
    }

    await callback(message, checkButtons)
}

//Функция, которая меняет этап в базе данных
async function setStage(conversationObject, dbStage_id, newStage, callback) {
    try {
        //Но сначала проверяем есть ли такой этап в карте
        if (conversationObject[newStage]) {
            //Этап есть, выполняем апдейт
            await UserConversationStage.update({
                stage: newStage,
            }, {where: {id: dbStage_id}})
            //сохраняем изменения в бд
            await UserConversationStage.sync()

            //Оповещаем пользователем сообщением с нового этапа
            await callback(conversationObject[newStage].switchMessage)
            //Мы не меняем шаг в этой функции чтобы не дублировать код, так же вызвав функцию изменения шага мы отправляем пользователю сообщение
            await setStep(conversationObject, dbStage_id, newStage, Object.keys(conversationObject[newStage].steps)[0], callback)
            return true
        } else {
            const firstStage = Object.keys(conversationObject)[0]
            const firstStep = Object.values(conversationObject)[0].steps[0]
            await UserConversationStage.update({
                stage: firstStage,
                step: firstStep,
            }, {where: {id: dbStage_id}})
            await UserConversationStage.sync()
            return true
        }
    } catch (e) {
        //TODO: Сделать обработку ошибок
        console.error(e)
        return false
    }
}

//Этой функцией мы меняем шаг
async function setStep(conversationObject, dbStage_id, stage, newStep, callback) {
    try {
        //Проверяем по карте, есть ли такой шаг
        if (conversationObject[stage].steps[newStep]) {
            //Шаг есть, меняем
            await UserConversationStage.update({
                step: newStep
            }, {where: {id: dbStage_id}})
            //Сохраняем
            await UserConversationStage.sync()
            //Отправляем пользователю сообщение из шага и кнопки
            await sendCallback(conversationObject[stage].steps[newStep].text, conversationObject[stage].steps[newStep].buttons, stage, callback, conversationObject)
            return true
        } else {
            await UserConversationStage.update({step: Object.keys(conversationObject[stage].steps)[0]}, {where: {id: dbStage_id}})
            await UserConversationStage.sync()
            return true
        }
    } catch (e) {
        console.error(e)
        //TODO:Опять ошибка, опять ничего не делаем, непорядок
        return false
    }
}



module.exports = {
    ConversationUpdateHandler
}
