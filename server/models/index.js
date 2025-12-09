import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';
import { Goal } from './goal.js';
import { UserStats } from './user-stats.js';
import { Notification } from './notification.js';


export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  login: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  walletAddress: {
    type: DataTypes.STRING(44),
    allowNull: true,
    field: 'wallet_address',
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: false
});


export const JwtToken = sequelize.define('JwtToken', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id'
  },
  refreshToken: {
    type: DataTypes.STRING(512),
    allowNull: false,
    field: 'refresh_token'
  }
}, {
  tableName: 'jwt_tokens',
  timestamps: false
});


// Определение связей
User.hasOne(JwtToken, { foreignKey: 'user_id' });
JwtToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Goal, { foreignKey: 'user_id' });
Goal.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(UserStats, { foreignKey: 'user_id' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });


export const models = {
  User,
  JwtToken,
  Goal,
  UserStats,
  Notification
};