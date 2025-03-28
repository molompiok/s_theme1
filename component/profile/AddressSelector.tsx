import React, {
  useState,
  useEffect,
  FormEvent,
  JSX,
  Suspense,
  useRef,
} from "react";
import { BsSearch, BsGeoAlt } from "react-icons/bs";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { BsTrash } from "react-icons/bs";
import { CiDeliveryTruck } from "react-icons/ci";
import axios from "axios";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { useGeolocationWithIP } from "../../hook/useGeolocationWithIP";
import Loading from "../Loading";
import { useAuthStore } from "../../store/user";
import {
  create_user_address,
  delete_user_address,
  update_user_address,
} from "../../api/user.api";
import { useMutation } from "@tanstack/react-query";

interface Address {
  id?: string;
  text: string;
  subtitle: string;
  lat: number | null;
  lng: number | null;
}

interface SuggestionItem {
  title: { text: string; hl?: { begin: number; end: number }[] };
  subtitle?: { text: string; hl?: { begin: number; end: number }[] };
  distance?: { text: string; value: number };
  address?: { formatted_address: string };
}

interface AddressSelectorProps {
  // apiKey: string;
  // geocoderApiKey: string;
  // bbox: string;
  // initialAddress?: Address | null;
  // onAddressChange: (address: Address | null) => void;
  // saveEndpoint?: string;
  // language?: string;
  // mapHeight?: string;
}

const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const getCoordinates = async (
  address: string,
  apiKey: string,
  bbox: string,
  lang: string,
  fallbackText?: string
): Promise<Address | null> => {
  const addressToGeocode = address.toLowerCase().includes("côte d'ivoire")
    ? address
    : `${address}, Côte d'Ivoire`;
  try {
    const response = await axios.get(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(
        addressToGeocode
      )}&bbox=${bbox}&lang=${lang}&format=json`
    );
    const geoObject =
      response.data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
    if (geoObject) {
      const [lng, lat] = geoObject.Point.pos.split(" ").map(Number);
      const resolvedAddress =
        geoObject.metaDataProperty.GeocoderMetaData.text ||
        fallbackText ||
        address;
      const subtitle =
        geoObject.metaDataProperty.GeocoderMetaData?.AddressDetails?.Country
          ?.AdministrativeArea?.SubAdministrativeArea?.Locality?.LocalityName ||
        geoObject.metaDataProperty.GeocoderMetaData.subtitle ||
        "";
      return { text: resolvedAddress, subtitle, lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Erreur de géocodage :", error);
    return null;
  }
};

const reverseGeocode = async (
  lat: number,
  lng: number,
  apiKey: string,
  bbox: string,
  lang: string
): Promise<Address | null> => {
  try {
    const response = await axios.get(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&bbox=${bbox}&lang=${lang}&format=json`
    );
    const geoObject =
      response.data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
    if (geoObject) {
      const text = geoObject.metaDataProperty.GeocoderMetaData.text;
      const subtitle =
        geoObject.metaDataProperty.GeocoderMetaData?.AddressDetails?.Country
          ?.AdministrativeArea?.SubAdministrativeArea?.Locality?.LocalityName ||
        geoObject.metaDataProperty.GeocoderMetaData.subtitle ||
        "";
      return { text, subtitle, lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Erreur de géocodage inverse :", error);
    return null;
  }
};

const getSuggestions = async (
  query: string,
  apiKey: string,
  bbox: string,
  lang: string
): Promise<SuggestionItem[]> => {
  try {
    const response = await axios.get(
      `https://suggest-maps.yandex.ru/v1/suggest?apikey=${apiKey}&text=${encodeURIComponent(
        query
      )}&bbox=${bbox}&results=10&print_address=1&lang=${lang}&highlight=1`
    );
    return (
      response.data?.results?.map((item: any) => ({
        title: { text: item.title.text, hl: item.title.hl || [] },
        subtitle: item.subtitle
          ? { text: item.subtitle.text, hl: item.subtitle.hl || [] }
          : { text: "" },
        distance: item.distance
          ? { text: item.distance.text, value: item.distance.value }
          : undefined,
        address: item.address
          ? { formatted_address: item.address.formatted_address }
          : undefined,
      })) || []
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions :", error);
    return [];
  }
};

const highlightText = (
  text: string,
  hl?: { begin: number; end: number }[]
): JSX.Element => {
  if (!hl || hl.length === 0) return <span>{text}</span>;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  hl.forEach(({ begin, end }, index) => {
    if (lastIndex < begin)
      parts.push(
        <span key={`plain-${index}`}>{text.slice(lastIndex, begin)}</span>
      );
    parts.push(
      <span key={`hl-${index}`} className="font-semibold text-gray-900">
        {text.slice(begin, end)}
      </span>
    );
    lastIndex = end;
  });
  if (lastIndex < text.length)
    parts.push(<span key="plain-end">{text.slice(lastIndex)}</span>);
  return <>{parts}</>;
};

const apiKey = "67b74e18-a7a6-40d9-82ae-fb7460a81010";
const geocoderApiKey = "21e88d05-cb30-4849-8e1c-dee1bb671c75";
const bbox = "4.19,-8.6~10.74,-2.49";
const language = "fr_FR";
export const AddressSelector: React.FC<{ mapHeight: string }> = ({
  mapHeight = "300px",
}) => {
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [address, setAddress] = useState<Address>(() => {
    const userAddress = user?.addresses?.[0];
    return {
      id: userAddress?.id,
      text: userAddress?.name?.split("/")[0] ?? userAddress?.name ?? "",
      subtitle: userAddress?.name?.split("/")[1] ?? "",
      lat: userAddress?.latitude ? parseFloat(userAddress.latitude) : null,
      lng: userAddress?.longitude ? parseFloat(userAddress.longitude) : null,
    };
  });
  const [searchInput, setSearchInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState<boolean>(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const { mapCenter, userPosition, setMapCenter } = useGeolocationWithIP();

  const createUserAddressMutation = useMutation({
    mutationFn: create_user_address,
    onSuccess: (newAddress) => {
      fetchUser();
      setAddress({ ...address, id: newAddress?.id });
      setMessage({ type: "success", text: "Adresse créée avec succès !" });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: "Erreur lors de la création de l'adresse.",
      });
      console.error("Erreur lors de la création de l'adresse :", error);
    },
  });

  const updateUserAddressMutation = useMutation({
    mutationFn: update_user_address,
    onSuccess: () => {
      fetchUser();
      setMessage({
        type: "success",
        text: "Adresse mise à jour avec succès !",
      });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: "Erreur lors de la mise à jour de l'adresse.",
      });
      console.error("Erreur lors de la mise à jour de l'adresse :", error);
    },
  });

  const deleteUserAddressMutation = useMutation({
    mutationFn: delete_user_address,
    onSuccess: () => {
      fetchUser();
      setAddress({ text: "", subtitle: "", lat: null, lng: null });
      setMessage({ type: "success", text: "Adresse supprimée avec succès !" });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: "Erreur lors de la suppression de l'adresse.",
      });
      console.error("Erreur lors de la suppression de l'adresse :", error);
    },
  });

  const fetchSuggestions = debounce(async () => {
    if (searchInput.trim().length > 2) {
      setIsLoading(true);
      const results = await getSuggestions(searchInput, apiKey, bbox, language);
      setSuggestions(results);
      setIsSuggestionOpen(true);
      setIsLoading(false);
    } else {
      setSuggestions([]);
      setIsSuggestionOpen(false);
    }
  }, 500);

  useEffect(() => {
    fetchSuggestions();
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveAddress = async (newAddress: Address | null) => {
    if (!newAddress) {
      if (address?.id) {
        deleteUserAddressMutation.mutate({ id: address.id });
      }
      return;
    }

    const addressData = {
      name: `${newAddress.text}/${newAddress.subtitle}`,
      id: newAddress.id,
      longitude: newAddress.lng?.toString() || "",
      latitude: newAddress.lat?.toString() || "",
      ...(address?.id && { id: address.id }),
    };

    if (address?.id) {
      const updatedAddressData = {
        name: addressData.name,
        longitude: addressData.longitude,
        latitude: addressData.latitude,
        id: address.id,
      };
      updateUserAddressMutation.mutate(updatedAddressData);
    } else {
      const { id, ...createAddressData } = addressData;
      createUserAddressMutation.mutate(createAddressData);
    }

    setAddress({ ...newAddress, id: address?.id || newAddress?.id });
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setMessage({ type: "error", text: "Veuillez entrer une adresse." });
      return;
    }
    setIsGeocoding(true);
    const coords = await getCoordinates(
      searchInput,
      geocoderApiKey,
      bbox,
      language
    );
    if (coords) {
      setAddress(coords);
      saveAddress(coords);
      setSearchInput("");
      setSuggestions([]);
      setIsSuggestionOpen(false);
    } else {
      setMessage({ type: "error", text: "Adresse introuvable." });
    }
    setIsGeocoding(false);
  };

  const handleSuggestionClick = async (suggestion: SuggestionItem) => {
    setIsGeocoding(true);
    const addressToGeocode =
      suggestion.address?.formatted_address || suggestion.title.text;
    const coords = await getCoordinates(
      addressToGeocode,
      geocoderApiKey,
      bbox,
      language
    );
    if (coords) {
      coords.subtitle = suggestion.subtitle?.text || coords.subtitle;
      setAddress(coords);
      saveAddress(coords);
      setSearchInput("");
      setSuggestions([]);
      setIsSuggestionOpen(false);
    }
    setIsGeocoding(false);
  };

  const handleAddressChange = (newAddress: Address) => {
    setAddress(newAddress);
    saveAddress(newAddress);
  };

  const handleDelete = () => {
    if (address?.id) {
      deleteUserAddressMutation.mutate({ id: address.id });
    }
  };

  const handleReturnToUserPosition = async () => {
    if (userPosition) {
      setIsGeocoding(true);
      const newAddress = await reverseGeocode(
        userPosition.lat,
        userPosition.lng,
        geocoderApiKey,
        bbox,
        language
      );
      if (newAddress) {
        setAddress(newAddress);
        setMapCenter([userPosition.lat, userPosition.lng]);
        saveAddress(newAddress);
      } else {
        setMessage({
          type: "error",
          text: "Impossible de localiser cette position.",
        });
      }
      setIsGeocoding(false);
    }
  };

  const animateZoomToMax = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setCenter([lat, lng], 17, {
        duration: 1000,
        timingFunction: "ease-in-out",
      });
    }
  };

  return (
    <section className="w-full p-4 bg-gray-50 rounded-lg shadow-sm relative">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Adresse de livraison
        </h2>
        <CiDeliveryTruck className="text-3xl text-gray-600" />
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Recherchez ou faites glisser le marqueur pour définir votre adresse.
      </p>

      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1">
            <label htmlFor="address-search" className="sr-only">
              Rechercher une adresse
            </label>
            <input
              id="address-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                address?.text 
                  ? "Modifier votre adresse"
                  : "Recherchez votre adresse"
              }
              className={`w-full p-2 text-sm border rounded-md focus:ring-2 focus:outline-none ${
                isGeocoding
                  ? "bg-gray-200 border-gray-300 cursor-not-allowed"
                  : "border-gray-300 focus:ring-gray-600"
              }`}
              disabled={isGeocoding}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || isGeocoding}
            className="w-full md:w-auto px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loading size="small" />
            ) : (
              <>
                <BsSearch size={16} />
                {address?.text ? "Modifier" : "Ajouter"}
              </>
            )}
          </button>
        </div>
        {isSuggestionOpen && suggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="font-medium">
                  {highlightText(suggestion.title.text, suggestion.title.hl)}
                </div>
                {suggestion.subtitle?.text && (
                  <div className="text-xs text-gray-500">
                    {highlightText(
                      suggestion.subtitle.text,
                      suggestion.subtitle.hl
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </form>

      {address?.text ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 break-all">
                {address.text}
              </p>
              {address.subtitle && (
                <p className="text-sm text-gray-700 break-all">
                  {address.subtitle}
                </p>
              )}
              <p className="text-xs text-gray-600">
                Lat: {address.lat?.toFixed(6) || "N/A"}, Lng:{" "}
                {address.lng?.toFixed(6) || "N/A"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchInput(address.text)}
                className="p-2 text-gray-600 hover:text-gray-600"
                aria-label="Modifier l'adresse"
              >
                <FiEdit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-600"
                aria-label="Supprimer l'adresse"
              >
                <BsTrash size={18} />
              </button>
            </div>
          </div>
          <Suspense fallback={<Loading size="medium" />}>
            <YMaps query={{ apikey: apiKey, lang: language as any }}>
              <Map
                state={{
                  center: [address.lat ?? 0, address.lng ?? 0],
                  zoom: 17,
                }}
                width="100%"
                height={mapHeight}
                instanceRef={(ref) => (mapRef.current = ref)}
                onLoad={() =>
                  address?.lat &&
                  address?.lng &&
                  animateZoomToMax(address.lat, address.lng)
                }
              >
                <Placemark
                  geometry={[address.lat, address.lng]}
                  options={{
                    preset: "islands#redDeliveryIcon",
                    draggable: true,
                  }}
                  onDragEnd={async (e: any) => {
                    const coords = e.get("target").geometry.getCoordinates();
                    const newAddress = await reverseGeocode(
                      coords[0],
                      coords[1],
                      geocoderApiKey,
                      bbox,
                      language
                    );
                    if (newAddress) handleAddressChange(newAddress);
                  }}
                />
              </Map>
            </YMaps>
          </Suspense>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <p className="text-sm mb-4">
            Aucune adresse définie. Utilisez la recherche ou votre position
            actuelle.
          </p>
          <button
            type="button"
            onClick={handleReturnToUserPosition}
            disabled={isGeocoding || !userPosition}
            className="w-full md:w-auto px-4 py-2 mb-4 text-sm font-semibold bg-white shadow-md border border-gray-100 text-gray-600 rounded-md hover:text-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <BsGeoAlt size={18} />
            Utiliser ma position actuelle
          </button>
          <Suspense fallback={<Loading size="medium" />}>
            <YMaps query={{ apikey: apiKey, lang: language as any }}>
              <Map
                state={{ center: mapCenter!, zoom: 17 }}
                width="100%"
                height={mapHeight}
                instanceRef={(ref) => (mapRef.current = ref)}
              >
                {userPosition && (
                  <Placemark
                    geometry={[userPosition.lat, userPosition.lng]}
                    options={{
                      preset: "islands#redDeliveryIcon",
                      draggable: true,
                    }}
                    onDragEnd={async (e: any) => {
                      const coords = e.get("target").geometry.getCoordinates();
                      const newAddress = await reverseGeocode(
                        coords[0],
                        coords[1],
                        geocoderApiKey,
                        bbox,
                        language
                      );
                      if (newAddress) handleAddressChange(newAddress);
                    }}
                  />
                )}
              </Map>
            </YMaps>
          </Suspense>
        </div>
      )}
      {message && (
        <div
          className={`mt-4 p-2 text-sm text-center rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {(isGeocoding ||
        createUserAddressMutation.isPending ||
        updateUserAddressMutation.isPending ||
        deleteUserAddressMutation.isPending) && (
        <div className="absolute right-[45%] top-[40%] bg-gray-200 bg-opacity-50 flex items-center justify-center z-20">
          <Loading size="large" />
        </div>
      )}
    </section>
  );
};

export default AddressSelector;
