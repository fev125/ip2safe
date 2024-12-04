const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class IpCollection extends Model {
    static associate(models) {
      IpCollection.belongsTo(models.User);
      IpCollection.hasMany(models.QueryHistory);
    }
  }

  IpCollection.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.ENUM('watchlist', 'blocklist', 'allowlist', 'custom'),
      defaultValue: 'custom'
    },
    ipAddresses: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    lastUpdated: {
      type: DataTypes.DATE
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    statistics: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalIps: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0
      }
    }
  }, {
    sequelize,
    modelName: 'IpCollection',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['type']
      }
    ]
  });

  return IpCollection;
}; 