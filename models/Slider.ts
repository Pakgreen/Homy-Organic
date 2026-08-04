import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISlider extends Document {
  title: string;
  image: string;
  desktopImage?: string;
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
    desktopImage: {
      type: String,
      default: "",
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
    strict: false,
  },
);

if (mongoose.models.Slider) {
  delete (mongoose.models as any).Slider;
}

const Slider: Model<ISlider> =
  mongoose.models.Slider || mongoose.model<ISlider>("Slider", SliderSchema);

export default Slider;
