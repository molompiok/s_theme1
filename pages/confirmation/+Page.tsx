import React, { useState } from "react";
import { IMask } from "react-imask";
import { useAuthStore } from "../../store/user";
import GoogleAuthButton from "../../component/Auth/GoogleAuthButton";
import { PhoneNumbers } from "../../component/profile/PhoneNumbers";
import LivraisonStep from "../../component/confirmation/LivraisonStep";
import { PersonalInfo } from "../../component/profile/PersonalInfo";
import { OrderSummary } from "../../component/confirmation/OrderSummary";
import clsx from "clsx";
import { useOrderInCart } from "../../store/cart";
import { formatPrice } from "../../utils";
import useCart from "../../hook/query/useCart";
import FinalInfo from "../../component/confirmation/FinalInfo";

interface DétailsCommande {
  adresse_livraison: string;
  nom_adresse_livraison: string;
  adresse_retrait: string;
  nom_adresse_retrait: string;
  prix_total: number;
  price_delivery: number;
  with_delivery: boolean;
  méthode_paiement: "carte_crédit" | "paypal" | "mobile_money" | "espèces";
  numéro_téléphone: string;
  articles: ArticlePanier[];
}

interface ArticlePanier {
  id: string;
  quantité: number;
  groupe_produit: {
    id: string;
    nom: string;
    prix: number;
  };
}

export default function PagePaiement() {

  // const [withDelivery, setWithDelivery] = useState<boolean>(false); // true pour livraison, false pour retrait
  // const [deliveryDate, setDeliveryDate] = useState<string>("25/03/2025"); // Date limite livraison
  // const [pickupDate, setPickupDate] = useState<string>("26/03/2025"); // Date limite retrait
  // const [phoneNumber, setPhoneNumber] = useState<string>("+221 77 123 45 67");
  // const [deliveryAddress, setDeliveryAddress] = useState<string>("123 Rue Exemple, Dakar");
  // const [pickupAddress, setPickupAddress] = useState<string>("Magasin Central, Dakar");
  // const [itemsPrice, setItemsPrice] = useState<number>(5000); // Prix des articles
  // const [deliveryPrice, setDeliveryPrice] = useState<number>(1000); // Prix livraison
  // const [isPending, setIsPending] = useState<boolean>(false); // État de chargement

  const [step, setStep] = useState<"info" | "livraison" | "Finalisation">("info");
  const user = useAuthStore((state) => state.user);

  const isPermitToProceed = user?.id && user.phone_numbers?.length > 0 && user.email && user.full_name;
  const { data: cart } = useCart();

  const totalPrice = cart?.total || 0;
  const getInfoErrorMessage = () => {
    if (!user?.id) return "Veuillez vous connecter pour continuer.";
    if (!user.full_name) return "Veuillez renseigner votre nom complet.";
    if (!user.email) return "Veuillez ajouter une adresse email valide.";
    if (!user.phone_numbers?.length) return "Veuillez ajouter un numéro de téléphone.";
    return null;
  };

  return (
    <div className="bg-white font-primary flex flex-col-reverse lg:flex-row min-h-screen">
      <div className="w-full lg:w-2/3 p-4 sm:p-6 bg-gray-50 pt-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-light mb-8 text-black border-b border-gray-200 pb-4">
            Confirmation de commande
          </h1>
          <div className="flex flex-col sm:flex-row justify-between mb-10 gap-4">
            <Step title="Information" active={step === "info"} completed={step !== "info"} />
            <Step title="Livraison" active={step === "livraison"} completed={step === "Finalisation"} />
            <Step title="Finalisation" active={step === "Finalisation"} />
          </div>
          <div className="space-y-8">
            {step === "info" && (
              <div className="space-y-6">
                {user?.id ? (
                  <>
                    <div className="space-y-4">
                      <PersonalInfo />
                      <PhoneNumbers style="bg-white" />
                    </div>
                    {!isPermitToProceed && (
                      <p className="text-sm text-red-500 font-semibold bg-red-100 p-3 rounded-md">
                        {getInfoErrorMessage()}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!isPermitToProceed}
                      onClick={() => setStep("livraison")}
                      className={clsx(
                        "w-full bg-black text-white p-3 rounded transition-colors",
                        {
                          "opacity-50 cursor-not-allowed": !isPermitToProceed,
                          "hover:bg-gray-800": isPermitToProceed,
                        }
                      )}
                      aria-label="Passer à l'étape livraison"
                    >
                      Passer à la Livraison
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-4 justify-center items-center">
                    <p className="text-lg text-center font-medium text-gray-800">
                      Vous devez être connecté pour passer une commande.
                    </p>
                    <GoogleAuthButton />
                    <p className="text-sm text-gray-600 text-center">
                      Connectez-vous rapidement avec Google pour continuer.
                    </p>
                  </div>
                )}
              </div>
            )}
            {step === "livraison" && (
              <LivraisonStep step={step} setStep={setStep} />
            )}
            {step === "Finalisation" && (
              <FinalInfo step={step} setStep={setStep} />
            )}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/3 bg-white shadow-sm rounded-lg p-6 lg:p-8 border border-gray-100 lg:sticky top-10">
        <OrderSummary />
      </div>
    </div>
  );
}
interface StepProps {
  title: string;
  active: boolean;
  completed?: boolean;
}

const Step: React.FC<StepProps> = ({ title, active, completed }) => (
  <div className="flex-1">
    <div className="flex items-center">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${active
            ? "border-black bg-black text-white"
            : completed
              ? "border-gray- bg-green-500 text-white"
              : "border-gray-300 bg-white"
          }`}
      >
        {completed ? "✓" : active ? "●" : "○"}
      </div>
      <p
        className={`ml-2  ${active ? "font-medium text-black" : "text-gray-500"
          }`}
      >
        {title}
      </p>
    </div>
    <div className="h-1 bg-gray-200 mt-2 sm:hidden">
      <div
        className={`h-full ${active || completed ? "bg-black" : "bg-gray-200"}`}
      />
    </div>
  </div>
);
