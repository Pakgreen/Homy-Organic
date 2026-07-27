import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISlider extends Document {
  title: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  position: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SliderSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Slider title is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Slider image is required"],
    },
    buttonText: {
      type: String,
      default: "Shop Now",
    },
    buttonLink: {
      type: String,
      default: "/products",
    },
    position: {
      type: String,
      enum: ["top", "after_row_1", "after_row_2", "after_row_3"],
      default: "top",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Slider: Model<ISlider> =
  mongoose.models.Slider || mongoose.model<ISlider>("Slider", SliderSchema);

export default Slider;
