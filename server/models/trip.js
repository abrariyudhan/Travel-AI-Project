'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Trip extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Trip.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Trip.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Title required"
        },
        notNull: {
          msg: "Title required"
        }
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Country required"
        },
        notNull: {
          msg: "Country required"
        }
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "City required"
        },
        notNull: {
          msg: "City required"
        }
      }
    },
    departureDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Departure date required"
        },
        notNull: {
          msg: "Departure date required"
        }
      }
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Duration required"
        },
        notNull: {
          msg: "Duration required"
        }
      }
    },
    budgetLevel: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Budget required"
        },
        notNull: {
          msg: "Budget required"
        }
      }
    },
    itinerary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft' 
    }
  }, {
    sequelize,
    modelName: 'Trip',
  });
  return Trip;
};