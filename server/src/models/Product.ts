import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'quantity' | 'description' | 'category' | 'imageUrl'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare category: string | null;
  declare quantity: number;
  declare price: number;
  declare imageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  }
);

export default Product;