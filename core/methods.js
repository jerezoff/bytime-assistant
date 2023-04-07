const {User} = require('./models');

async function testCallback(callback) {
    callback('testCallback')
}

async function updateFirstName(message_text, db_id_type, user_id) {
    try {
        await User.update({first_name: capitalizeFirstWord(message_text)}, {where: {[db_id_type]: user_id}})
    } catch (e) {
        return false
    }
}

async function updateLastName(message_text, db_id_type, user_id) {
    try {
        await User.update({last_name: capitalizeFirstWord(message_text)}, {where: {[db_id_type]: user_id}})
    } catch (e) {
        return false
    }
}

async function updatePhone(message_text, db_id_type, user_id) {
    try {
        await User.update({phone: message_text.trim()}, {where: {[db_id_type]: user_id}})
    } catch (e) {
        return false
    }
}

async function updateEmail(message_text, db_id_type, user_id) {
    try {
        await User.update({email: message_text.trim(), registerComplete: true}, {where: {[db_id_type]: user_id}})
    } catch (e) {
        return false
    }
}

async function setUserStatus(message_text, db_id_type, user_id) {
    try {
        await User.update({status: 'user'}, {where: {[db_id_type]: user_id}})
    } catch (e) {
        return false
    }
}

function capitalizeFirstWord(text) {
    const word = text.split(' ')[0]
    const firstLetter = word.charAt(0)
    const firstLetterCap = firstLetter.toUpperCase()
    const remainingLetters = word.slice(1)
    return firstLetterCap + remainingLetters
}

module.exports = {
    testCallback,
    updateFirstName,
    updateLastName,
    updatePhone,
    updateEmail,
    setUserStatus
}
