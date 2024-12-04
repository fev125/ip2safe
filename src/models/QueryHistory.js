const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class QueryHistory extends Model {
    static associate(models) {
      QueryHistory.belongsTo(models.User);
      QueryHistory.belongsTo(models.IpCollection);
    }
  }

  QueryHistory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    queryType: {
      type: DataTypes.STRING  // 'single', 'batch'
    },
    providers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    results: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    riskScore: {
      type: DataTypes.INTEGER
    },
    threatLevel: {
      type: DataTypes.STRING
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'QueryHistory',
    indexes: [
      {
        fields: ['ipAddress']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return QueryHistory;
}; 