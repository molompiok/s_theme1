export type ProductType = {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string;
  default_feature_id: string;
  price: number;
  barred_price: number;
  slug : string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductFavorite = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  default_feature_id: string;
  description: string;
  barred_price: number | null;
  price: number;
  currency: string;
  created_at: string; 
  updated_at: string; 
  user_id: string;
  label: string;
  product_id: string;
};



export type FeatureValue = {
  id: string;
  featureId: string;
  currency: string;
  views: string[]; 
  icon: string | null; 
  text: string | null; 
  additionalPrice: number;
  min: number | null; 
  max: number | null;
  minSize: number | null; 
  maxSize: number | null; 
  multiple: boolean;
  isDouble: boolean;
  createdAt: string | Date; 
  updatedAt: string | Date; 
};

export type Feature = {
  id: string;
  productId: string;
  name: string;
  type: string | null; 
  icon: string[];
  required: boolean;
  default: string | number | null; 
  createdAt: string | Date; 
  updatedAt: string | Date; 
  values: FeatureValue[]; 
};

export type FeaturesResponse = {
  features: Feature[]; // Tableau de Feature
};
export type GroupFeatureType = {
  id: string,
  product_id: string,
  stock: number,
  bind: object,
  created_at: string,
  updated_at: string
}


export type MetaPagination = {
  "total": number,
  "perPage": number,
  "currentPage": number,
  "lastPage": number,
  "firstPage": number,
  "firstPageUrl": string,
  "lastPageUrl": string,
  "nextPageUrl": null,
  "previousPageUrl": null
}
type ProductPick = 'barred_price' | 'description' | 'name' | 'id' | 'price' | 'currency' | 'default_feature_id' | 'slug';

export type ProductClient = Pick<ProductType, ProductPick> 