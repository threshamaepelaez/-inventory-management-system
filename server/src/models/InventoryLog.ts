import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';
import User from './User';

interface InventoryLogAttributes {
  id: number;
  product_id: number;
  user_id: number;
  action: 'add' | 'update' | 'remove';
  quantity_changed: number;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryLogCreationAttributes extends Optional<InventoryLogAttributes, 'id'> {}

class InventoryLog extends Model<InventoryLogAttributes, InventoryLogCreationAttributes> implements InventoryLogAttributes {
  declare id: number;
  declare product_id: number;
  declare user_id: number;
  declare action: 'add' | 'update' | 'remove';
  declare quantity_changed: number;
  declare notes: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InventoryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('add', 'update', 'remove'),
      allowNull: false,
    },
    quantity_changed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'InventoryLog',
    tableName: 'inventory_logs',
    timestamps: true,
  }
);

// Associations
InventoryLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
InventoryLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default InventoryLog;