import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGlobalSettings extends Document {
  strictMode: boolean;
  copyPasteBlocker: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const GlobalSettingsSchema: Schema<IGlobalSettings> = new Schema(
  {
    strictMode: { type: Boolean, default: true },
    copyPasteBlocker: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const GlobalSettings: Model<IGlobalSettings> = mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);

export default GlobalSettings;
