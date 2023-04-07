const {updateFirstName, updateLastName, updatePhone, updateEmail, setUserStatus} = require('./methods');

function conversationSwitch(user_status) {
    switch (user_status) {
        case 'new':
            return newbieConversation
        case 'user':
            return userConversation
        default:
            throw new Error('Не найдено карты для такого типа пользователя')
    }
}

const userConversation = {
    'start': {
        switchMessage: 'Поздравляем с успешной регистрацией, вы попали в главное меню, чего бы вы хотели сделать сегодня?',
        globalButtons: [
            {text: 'В главное меню', id: 'home'},
        ],
        globalButtonsLogic: {
            'home': {
                actions: [
                    {text: 'Заново', type: 'setStep', value: 'start'},
                ],
            },
        },
        steps: {
            'start': {
                text: 'Добро пожаловать в главное меню',
                buttons: [
                    {text: 'Меню управления задачами', id: 'task_menu'},
                    {text: 'Мой аккаунт', id: 'account_menu'},
                    {row: true},
                    {text: 'Запросить помощь', id: 'help'},
                    {text: 'FAQ', id: 'faq'},
                ],
                buttonsLogic: {
                    'help': {
                        actions: [
                            {type: 'sendMessage', value: 'я сообщу администратору что вам нужна помощь, ожидайте'},
                        ]
                    },
                    'faq': {
                        actions: [
                            {type: 'sendMessage', value: 'бла бла бла, правила, всякое такое'},
                        ]
                    },
                    'task_menu': {
                        actions: [
                            {type: 'sendMessage', value: 'типа переключились на меню с задачами'},
                        ]
                    },
                    'account_menu': {
                        actions: [
                            {type: 'sendMessage', value: 'вот твой аккаунт'},
                        ]
                    },
                }
            },
            'tasks': {
                text: 'Меню управления задачами'
            }
        }
    },
}

const newbieConversation = {
    'start': {
        switchMessage: 'Я чат-бот, помощник который может связать тебя с хорошими специалистами своего дела, вы платите - они делают',
        globalButtons: [
            {text: 'В главное меню', id: 'home'},
        ],
        globalButtonsLogic: {
            'home': {
                actions: [
                    {text: 'Заново', type: 'setStep', value: 'start'},
                ],
            },
        },
        steps: {
            'start': {
                text: 'Для начала вам нужно зарегистрироваться!',
                buttons: [
                    {text: 'Зарегистрироваться', id: 'register'},
                    {text: 'Что ты такое?', id: 'info'}
                ],
                buttonsLogic: {
                    'register': {
                        actions: [{
                            type: 'setStage',
                            value: 'register',
                        }]
                    },
                    'info': {
                        actions: [{
                            type: 'sendMessage',
                            value: 'Я чат бот, просто чат бот',
                        }]
                    },
                }
            }
        },
    },
    'register': {
        switchMessage: 'Для начала давайте познакомимся!',
        globalButtons: [
            {text: 'Заново', id: 'retry'},
            {text: 'Отмена', id: 'cancel'}
        ],
        globalButtonsLogic: {
            'retry': {
                actions: [
                    {text: 'Заново', type: 'setStep', value: 'first_name'},
                ],
            },
            'cancel': {
                actions: [
                    {text: 'Отмена', type: 'setStage', value: 'start'}
                ]
            }
        },
        steps: {
            'first_name': {
                text: 'Напишите ваше имя!',
                textLogic: {
                    actions: [
                        {type: 'startFunction', func: updateFirstName},
                        {type: 'setStep', value: 'last_name'}
                    ]
                },
            },
            'last_name': {
                text: 'Теперь напишите вашу фамилию',
                textLogic: {
                    actions: [
                        {type: 'startFunction', func: updateLastName},
                        {type: 'setStep', value: 'phone'}
                    ]
                },
            },
            'phone': {
                text: 'Укажите ваш номер телефона',
                textLogic: {
                    actions: [
                        {type: 'startFunction', func: updatePhone},
                        {type: 'setStep', value: 'email'}
                    ]
                }
            },
            'email': {
                text: 'Теперь ваш EMail',
                textLogic: {
                    actions: [
                        {type: 'startFunction', func: updateEmail},
                        {type: 'startFunction', func: setUserStatus},
                        {type: 'sendMessage', value: 'Регистрация окончена'},
                    ]
                }
            },
        },
    }
}

module.exports = {
    conversationSwitch
}
