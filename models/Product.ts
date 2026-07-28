import mongoose, { Schema, Document, Model } from "mongoose";
import "./Category";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  imageLabels?: string[];
  brand?: string;
  ratings: number;
  isFeatured: boolean;
  isDisabled: boolean;
  keyBenefits?: string[];
  naturalIngredients?: string[];
  howToUse?: string;
  precautions?: string;
  ourQuality?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    imageLabels: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    keyBenefits: {
      type: [String],
      default: [],
    },
    naturalIngredients: {
      type: [String],
      default: [],
    },
    howToUse: {
      type: String,
      default: "",
    },
    precautions: {
      type: String,
      default: "",
    },
    ourQuality: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

if (mongoose.models && mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
