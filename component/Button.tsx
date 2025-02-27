import { useMemo } from "react";
import { features, FeaturesType, ProductType } from "../S1_data";
import { useproductFeatures, useProductSelectFeature } from "../store/features";
import clsx from "clsx";
import { usePanier } from "../store/cart";

export function CartButton({
  text,
  product,
}: {
  text: string;
  product: ProductType;
}) {
  const setFeatureModal = useProductSelectFeature(
    (state) => state.setFeatureModal
  );
  return (
    <div className="px-2  w-full group relative overflow-hidden inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          document.body.style.overflow = "hidden";
          setFeatureModal(true, product, features);
        }}
        className="w-full border  py-1.5 border-gray-300 px-1 rounded-xl cursor-pointer relative z-10 bg-white overflow-hidden"
      >
        <span className="relative whitespace-nowrap z-20 group-hover:underline font-light group-hover:text-white transition-all duration-500 text-clamp-sm -translate-y-1/2 group-hover:translate-y-0">
          <span className="hidden button-cart-1:inline">{text}</span>
        </span>
        <div className="absolute -top-1 left-0 w-full h-[calc(100%+.25rem)] bg-black z-10 transition-transform duration-500 transform -translate-y-full group-hover:translate-y-0"></div>
      </button>
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
  const carts = usePanier((state) => state.panier);
  const toggleCart = usePanier((state) => state.toggleCart);

  const handleModalcartClose = () => {
    toggleCart(false);
    document.body.style.overflow = "auto";
  };
  const totalItems = carts.reduce((acc, item) => acc + item.nbr, 0);
  return (
    <div className="w-full group relative inline-block">
      <button
        onClick={() => {
          if (totalItems === 0) return handleModalcartClose();
          callBack?.();
        }}
        className="w-full border border-gray-300 px-2 py-1.5 cursor-pointer relative z-10 bg-black/60 overflow-hidden rounded-sm"
      >
        <span className="relative whitespace-nowrap z-20 group-hover:underline text-white transition-all duration-500 text-clamp-base -translate-y-1/2 group-hover:translate-y-0">
          <span className="hidden button-cart-1:inline">
            {totalItems === 0 ? "Ajouter un produit" : text}
          </span>
        </span>
        <div className="absolute top-0 left-0 w-full h-full bg-black z-10 transition-transform duration-500 transform translate-y-full group-hover:translate-y-0"></div>
      </button>
    </div>
  );
}

export function ButtonValidCart({
  features,
  // productId,
  product,
  onClick
}: {
  features: FeaturesType[];
  product: ProductType;
  onClick: () => void
  // productId: string;
}) {
  const pfeature = useproductFeatures((state) => state.productFeatures);

  const ProductWhoRequired = useMemo(() => {
    let val = features.find((f) => {
      const v = f.required;
      let validIsFIll = false;
      if (v) {
        validIsFIll = Boolean(pfeature.get(product?.id)?.get(f.name));
        return !validIsFIll;
      } else {
        return validIsFIll;
      }
    });
    return val;
  }, [pfeature, features]);
  return (
    <button
      disabled={!!ProductWhoRequired?.id}
      onClick={() => {
        if (ProductWhoRequired?.id) return;
        onClick?.()
     
      }}
      className={clsx(
        `mx-auto cursor-pointer text-center text-clamp-base uppercase text-cyan-50 w-[90%] py-2 px-4 mt-7`,
        {
          "bg-black/45": Boolean(ProductWhoRequired?.id),
          "bg-black": Boolean(!ProductWhoRequired?.id),
        }
      )}
    >
      {Boolean(ProductWhoRequired?.id)
        ? "selectionnez " + ProductWhoRequired?.name
        : "Ajouter au panier"}
    </button>
  );
}
