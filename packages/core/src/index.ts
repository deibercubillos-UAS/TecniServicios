/**
 * packages/core — lógica de negocio de Tecni Equipos y Servicios SAS.
 *
 * Sin dependencias de React ni de Next.js (ver docs/01-ARCHITECTURE.md
 * sección 3). Intencionalmente vacío en la Fase 0: la lógica de negocio
 * (catalog, commerce, service, companies, content, audit) se implementa
 * a partir de la Fase 1, junto con el esquema de datos y RLS que la
 * respaldan.
 */
export const CORE_PACKAGE_NAME = "@tecni/core";

export {
  registerUser,
  type RegisterUserInput,
  type RegisterUserContext,
  type RegisterUserResult,
} from "./companies/register-user";

export {
  resolvePrice,
  type ResolvePriceProduct,
  type ResolvePriceContext,
  type PriceResolution,
} from "./catalog/resolve-price";

export {
  getAllowedCatalogSorts,
  isCatalogSortAllowed,
  type CatalogSort,
} from "./catalog/catalog-sort";

export {
  submitContactMessage,
  type SubmitContactMessageContext,
} from "./content/submit-contact-message";

export {
  splitCartByThreshold,
  type CartItemForSplit,
  type CartSplitResult,
} from "./commerce/split-cart-by-threshold";

export {
  getOrCreateCartId,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  type CartContext,
  type AddCartItemInput,
} from "./commerce/cart";

export {
  requestQuote,
  type RequestQuoteContext,
  type RequestQuoteItem,
  type RequestQuoteResult,
} from "./commerce/request-quote";

export {
  acceptQuote,
  type AcceptQuoteContext,
  type AcceptQuoteResult,
} from "./commerce/accept-quote";
