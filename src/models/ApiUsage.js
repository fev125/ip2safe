const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ApiUsage extends Model {
    static associate(models) {
      ApiUsage.belongsTo(models.ApiKey);
    }
  }

  ApiUsage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    callCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    errorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    quotaUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    responseTime: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    errors: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'ApiUsage',
    indexes: [
      {
        fields: ['date']
      },
      {
        fields: ['ApiKeyId', 'date'],
        unique: true
      }
    ]
  });

  return ApiUsage;
}; 