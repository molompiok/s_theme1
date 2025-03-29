import { useMemo } from "react";
import { useproductFeatures, useProductSelectFeature } from "../store/features";
import clsx from "clsx";
import { useModalCart } from "../store/cart";
import { Feature, GroupProductType, ProductClient } from "../pages/type";
import { useQuery } from "@tanstack/react-query";
import { get_features_with_values } from "../api/products.api";
import AddRemoveItemCart from "./AddRemoveItemCart";
import Loading from "./Loading";
import { useAuthStore } from "../store/user";
import { useUpdateCart } from "../hook/query/useUpdateCart";
import useCart from "../hook/query/useCart";
import { getAllOptions, getOptions } from "../utils";
export function CartButton({
  text,
  product,
}: {
  text: string;
  product: ProductClient;
}) {
  const setFeatureModal = useProductSelectFeature(
    (state) => state.setFeatureModal
  );
  const { data: cart } = useCart();
  const toggleCart = useModalCart((state) => state.toggleCart);

  const product_id = product?.id;

  const updateCartMutation = useUpdateCart();

  const { data: features, status } = useQuery({
    queryKey: ["get_features_with_values", product_id],
    queryFn: () =>
      product_id ? get_features_with_values({ product_id }) : null,
    enabled: !!product_id,
  });

  const atLeastOneFeatureHasTwoValues = useMemo(
    () => features?.some((feature) => {
      return feature.values.length >= 2;
    }), 
    [features,product_id]
  );


  const selections = useproductFeatures((state) => state.selections);

  const bind = useMemo(() => {
    const productSelections = selections?.get(product.id);
    if (!productSelections) return {};
    const bind: Record<string, string> = {};
    productSelections.forEach((value, key) => {
      bind[key] = value.valueFeature;
    });
    return bind;
  }, [selections, product?.id]);

  if (!features) {
    return <div>⛔</div>;
  }
  const group_products = getOptions({ bind, features, product_id });

  const stock =  atLeastOneFeatureHasTwoValues  ? Infinity : group_products?.stock || 0;
  const itemInPanier = cart?.cart?.items?.find((item) => item?.product?.id === product_id);

  const handleFeatureModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    document.body.style.overflow = "hidden";
    setFeatureModal(true, product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!atLeastOneFeatureHasTwoValues) {
      toggleCart(true);
      if (group_products) {
        updateCartMutation.mutate({
          product_id: product_id,
          bind,
          mode: "increment",
          value: 1,
        });
      }
    } else {
      setFeatureModal(true, product);
    }
  };

  const buttonClasses = `
    flex justify-center items-center w-full border py-1 
    border-gray-500 rounded-xs cursor-pointer relative z-10 
    bg-white overflow-hidden
  `;

  const textClasses = `
    whitespace-nowrap z-20 group-hover:text-black 
    group-hover:font-bold transition-all duration-500 
    text-clamp-base group-hover:translate-y-0
  `;

  return (
    <div className="w-full font-secondary group relative mt-auto overflow-hidden inline-block">
      {atLeastOneFeatureHasTwoValues ? (
        <button
          disabled={status !== "success" || stock === 0}
          onClick={handleFeatureModalClick}
          className={buttonClasses}
        >
          <div className={textClasses}>
            <span className="inline">
              {stock !== 0 ? "Voir plus" : "Indisponibles"}
            </span>
          </div>
        </button>
      ) : (
        <>
          {itemInPanier?.quantity === 0 || !itemInPanier ? (
            <button
              disabled={status !== "success" || stock === 0}
              onClick={handleAddToCartClick}
              className={buttonClasses}
            >
              <div className={textClasses}>
                <span className="inline">
                  {stock !== 0 ? text : "Indisponible"}
                </span>
              </div>
            </button>
          ) : (
            <AddRemoveItemCart
              product={product}
              bind={bind}
              features={features}
              inList
            />
          )}
        </>
      )}
    </div>
  );
}

export function CommandButton({
  text,
  callBack,
}: {
  text: string;
  callBack?: () => void;
}) {
  const toggleCart = useModalCart((state) => state.toggleCart);
  const { data: cart } = useCart();
  const handleModalCartClose = () => {
    toggleCart(false);
    document.body.style.overflow = "auto";
  };

  const totalItems = cart?.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="w-full group relative inline-block">
      <button
        onClick={() => {
          if (totalItems === 0) return handleModalCartClose();
          callBack?.();
        }}
        className="w-full border border-gray-300 px-2 py-2.5 cursor-pointer relative z-10 bg-black/60 overflow-hidden rounded-sm"
      >
        <span className="relative whitespace-nowrap z-20 group-hover:underline text-white transition-all duration-500 text-clamp-base -translate-y-1/2 group-hover:translate-y-0">
          <span className="inline">
            {totalItems === 0 ? "Ajouter un produit" : text}
          </span>
        </span>
        <div className="absolute top-0 left-0 w-full h-full bg-black z-10 transition-transform duration-500 transform translate-y-full group-hover:translate-y-0"></div>
      </button>
    </div>
  );
}

interface ButtonValidCartProps {
  features?: Feature[];
  product: ProductClient;
}

function SingleValuedFeaturesButton({
  handleAddToCart,
}: {
  handleAddToCart: () => void;
}) {
  

  return (
    <button
      onClick={() => handleAddToCart()}
      className={clsx(
        "mx-auto cursor-pointer text-center text-clamp-base uppercase bg-black text-gray-50 w-full py-3 px-4 mt-7 min-h-[48px]"
      )}
    >
      Ajouters au panier
    </button>
  );
}

function MultiValuedFeaturesButton({
  productIsRequired,
  matchingGroup,
  handleAddToCart,
}: {
  productIsRequired: Feature | undefined;
  handleAddToCart: () => void;
  matchingGroup: GroupProductType | undefined
}) {
  if (!matchingGroup) {
    return (
      <div className="min-h-[48px] mx-auto text-center text-clamp-base uppercase text-gray-50 w-full py-3 px-4 mt-1 bg-black/45">
        Sélectionnez une variante
      </div>
    );
  }
  return (
    <button
      disabled={!!productIsRequired}
      onClick={() => handleAddToCart()}
      className={clsx(
        "mx-auto cursor-pointer text-center text-clamp-base uppercase text-gray-50 w-full py-3 px-4 mt-7 min-h-[48px]",
        {
          "bg-black/45": !!productIsRequired,
          "bg-black hover:bg-gray-900": !productIsRequired,
        }
      )}
    >
      {productIsRequired
        ? `Sélectionnez ${productIsRequired.name}`
        : "Ajouters au panier"}
    </button>
  );
}

export function ButtonValidCart({
  features = [],
  product,
}: ButtonValidCartProps) {
  const allFeaturesAreSingleValued = features.every(
    (feature) => feature.values.length <= 1
  );
  const updateCartMutation = useUpdateCart();

  const toggleCart = useModalCart((st) => st.toggleCart);
  const setFeatureModal = useProductSelectFeature(
    (state) => state.setFeatureModal
  );


  const selections = useproductFeatures((state) => state.selections);
  
  const bind = useMemo(() => {
    const productSelections = selections?.get(product.id);
    if (!productSelections) return {};
    const bind: Record<string, string> = {};
    productSelections.forEach((value, key) => {
      bind[key] = value.valueFeature;
    });
    return bind;
  }, [selections, product.id]);
  
  const group_products = getOptions({ bind, features, product_id: product.id });

  const productIsRequired = useMemo(() => {
  return features?.find((feature) => {
    if (feature.required) {
      return !selections.get(product.id)?.has(feature.id) && feature.required;
    }
    return false;
  });
}, [features, selections, product.id])


  const handleAddToCart = () => {
    toggleCart(true);
    document.body.style.overflow = "hidden";
    setFeatureModal(false);
    updateCartMutation.mutate({
      product_id: product.id,
      bind,
      mode: "increment",
      value: 1,

    });
  };
  
  if (!group_products) {
    return <div>⛔⛔⛔</div>;
  }

  return allFeaturesAreSingleValued ? (
    <SingleValuedFeaturesButton
      // group_products={group_products}
      handleAddToCart={handleAddToCart}
    />
  ) : (
    <MultiValuedFeaturesButton
      productIsRequired={productIsRequired}
      handleAddToCart={handleAddToCart}
      matchingGroup={group_products}
    />
  );
}
