import { formatSlug } from './../../../utils';
// https://vike.dev/data
export { data }
export type Data = Awaited<ReturnType<typeof data>>
import { dehydrate } from "@tanstack/react-query"
import { PageContextServer } from "vike/types";
import { createQueryClient } from "../../../utils";
import { get_features_with_values, get_products } from "../../../api/products.api";
import { BASE_URL } from "../../../api";

const data = async (pageContext: PageContextServer) => {
  const queryClient = createQueryClient()
  const slug = pageContext.routeParams!.id

  await queryClient.prefetchQuery({ queryKey: ['gets_products',], queryFn: () => get_products({slug}) })

  const product = await queryClient.ensureQueryData({ queryKey:['get_products', slug] , queryFn: () => get_products({slug}) })

  const features = await queryClient.ensureQueryData({ 
    queryKey: ['get_features_with_values', product?.[0].default_feature_id], 
    queryFn: () => get_features_with_values({ feature_id: product?.[0].default_feature_id}) })
  const mediaList = (features?.[0]?.values.length ?? 0 > 0 ? features?.[0]?.values[0].views : [])!;

  const firstImg = mediaList.find((media: string) => media.endsWith(".webp"));
  return {
    dehydratedState: dehydrate(queryClient),
    title: product?.[0]?.name || 'Page Produit',
    slug,
    meta: {
      title: product?.[0]?.name || 'Page Produit',
      description: product?.[0]?.description || 'Description du produit',
      og: {
        title: product?.[0]?.name || 'Page Produit',
        description: product?.[0]?.description || 'Description du produit',
        image: firstImg ? BASE_URL + firstImg : '/default-image.jpg',
      }
    }
  }
}