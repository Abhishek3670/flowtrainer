// backend/src/services/modelService.ts
import { ModelConfig, IModelConfig } from '../models/ModelConfig';

export const modelService = {
  async getModels(): Promise<IModelConfig[]> {
    const models = await ModelConfig.find().sort({ updatedAt: -1 }).lean();
    return models.map(m => ({ ...m, id: (m as any)._id?.toString?.() } as any));
  },
  async createModel(data: Partial<IModelConfig>): Promise<IModelConfig> {
    const created = await ModelConfig.create(data);
    return created.toObject() as any;
  },
  async updateModel(id: string, data: Partial<IModelConfig>): Promise<IModelConfig | null> {
    const updated = await ModelConfig.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated as any;
  },
  async deleteModel(id: string): Promise<void> {
    await ModelConfig.findByIdAndDelete(id);
  }
};