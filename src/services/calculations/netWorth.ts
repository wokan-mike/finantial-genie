import { AssetSchema, LiabilitySchema } from '../database/schema';

export const calculateNetWorth = (assets: AssetSchema[], liabilities: LiabilitySchema[]): number => {
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  return totalAssets - totalLiabilities;
};

export const calculateTotalAssets = (assets: AssetSchema[]): number => {
  return assets.reduce((sum, asset) => sum + asset.value, 0);
};

export const calculateTotalLiabilities = (liabilities: LiabilitySchema[]): number => {
  return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
};

