// backend/src/services/modelService.ts
export const modelService = {
  async getModels() {
    return [];
  },
  async createModel(data: any) {
    return { id: 'model_' + Date.now(), ...data };
  },
  async updateModel(id: string, data: any) {
    return { id, ...data };
  },
  async deleteModel(id: string) {
    return { success: true };
  }
};