const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class ApiKey extends Model {
    static associate(models) {
      ApiKey.belongsTo(models.User);
      ApiKey.hasMany(models.ApiUsage);
    }
  }

  ApiKey.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provider: {
      type: DataTypes.ENUM('abuseipdb', 'ip2location', 'ipinfo', 'ipregistry'),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        const encryptedKey = this.getDataValue('key');
        if (!encryptedKey) return null;
        const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
        return decipher.update(encryptedKey, 'hex', 'utf8') + decipher.final('utf8');
      },
      set(value) {
        if (!value) return;
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
        const encryptedKey = cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
        this.setDataValue('key', encryptedKey);
      }
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    dailyQuota: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    lastUsed: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'ApiKey'
  });

  return ApiKey;
}; 