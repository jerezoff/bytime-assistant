const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://test:test@localhost:5432/assistant_test');

const User = sequelize.define('user', {
    telegram_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new'
    },
    registerComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})

const Task = sequelize.define('task', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false
    },
    completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'created'
    }
})

const UserConversationStage = sequelize.define('userConversationStage', {
    stage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'start'
    },
    step: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'start'
    }
})

User.hasOne(UserConversationStage)
UserConversationStage.belongsTo(User)

//sequelize.sync({force: true})

module.exports = {
    User,
    UserConversationStage,
    sequelize
}
