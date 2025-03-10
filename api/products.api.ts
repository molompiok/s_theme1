import { Feature, FeaturesResponse, GroupFeatureType, MetaPagination, ProductClient, ProductFavorite, ProductType } from "../pages/type";
import { api } from ".";


export const get_products = async ({ product_id, store_id, slug,search, order_by, category_id, page = 1, limit = 10 }: {
    product_id?: string, store_id?: string, search?: string, slug?: string, 
    order_by?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc',
    category_id?: string, page?: number, limit?: number
}) => {
    const searchParams = new URLSearchParams()
    if (product_id) searchParams.set('product_id', product_id)
    if (store_id) searchParams.set('store_id', store_id)
    if (slug) searchParams.set('slug', slug)
    if (search) searchParams.set('search', search)
    if (order_by) searchParams.set('order_by', order_by)
    if (category_id) searchParams.set('category_id', category_id)
    if (page) searchParams.set('page', page.toString())
    if (limit) searchParams.set('limit', limit.toString())


    try {
        const { data: products } = await api.get<{ list: ProductType[], meta: MetaPagination }>('/get_products?' + searchParams.toString());

        function minimize(product: ProductType): ProductClient {
            const { barred_price, description, name, id, price, currency, default_feature_id , slug } = product;
            return { barred_price, description, name, id, price, currency, default_feature_id , slug };
        }
        return products.list.map(minimize);
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :" + error);
        return [];
    }
};


export const get_features_with_values = async ({ product_id, feature_id }: { product_id?: string, feature_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (product_id) searchParams.set('product_id', product_id)
    if (feature_id) searchParams.set('feature_id', feature_id)
    try {
        const { data } = await api.get<FeaturesResponse>('/get_features_with_values?' + searchParams.toString());
        return data.features
    } catch (error) {
        console.error("Erreur lors de la récupération des features :", error);
        throw new Error("Erreur lors de la récupération des features :" + error);
    }
}




export const get_group_features = async ({ product_id, group_feature_id }: { group_feature_id?: string, product_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (product_id) searchParams.set('product_id', product_id)
    if (group_feature_id) searchParams.set('feature_id', group_feature_id)
    try {
        const { data: features } = await api.get<{ list: GroupFeatureType[], meta: MetaPagination }>('/get_group_features?' + searchParams.toString());
        return features.list
    } catch (error) {
        console.error("Erreur lors de la récupération des features :", error);
        return [];
    }
}
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**********favoris */
export const create_favorite = async (data: { product_id: string }) => {
    const formData = new FormData();
    formData.append('product_id', data.product_id)
    try {
        const { data: favorite } = await api.post<{ id: string }>('/create_favorite', formData);
       await delay(1000)
        return !!favorite.id
    } catch (error) {
        console.error("Erreur lors de l'ajout de favoris :", error);
        return [];
    }
}

export const delete_favorite = async (id: string) => {
    // data.user_id = "85565855-91d0-4c20-ae01-7b2b7ab0e175"
    // const formData = new FormData();
    // formData.append('user',data.user_id)
    // formData.append('product_id',data.product_id)
    try {
        const { data: favorite } = await api.delete<{ isDeleted: boolean }>('/delete_favorite/' + id);
        await delay(1000)
        return favorite.isDeleted
    } catch (error) {
        console.error("Erreur lors du retrait du favoris :", error);
        return [];
    }
}

export const get_favorites = async ({
    user_id,
    label,
    product_id,
    order_by,
    page,
    limit,
  }: {
    user_id?: string;
    label?: string;
    product_id?: string;
    order_by?: "date_asc" | "date_desc" | "price_asc" | "price_desc";
    page?: number;
    limit?: number;
  }) => {
    console.log("🚀 ~ get_favorites called with params:", {
      user_id,
      label,
      product_id,
      order_by,
      page,
      limit,
    });
  
    const searchParams = new URLSearchParams();
    if (user_id) searchParams.set("user_id", user_id);
    if (product_id) searchParams.set("product_id", product_id);
    if (label) searchParams.set("label", label);
    if (order_by) searchParams.set("order_by", order_by);
    if (page) searchParams.set("page", page.toString());
    if (limit) searchParams.set("limit", limit.toString());
  
    const queryString = searchParams.toString();
    console.log("🚀 ~ searchParams:", queryString);
  
    try {
      const { data: favorites } = await api.get<{ list: ProductFavorite[] }>(
        `/get_favorites?${queryString}`
      );
      await delay(3000);
      return favorites.list;
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris :");
      throw error;
    }
  };
