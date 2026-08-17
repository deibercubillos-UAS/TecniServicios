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
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductVideo,
  type ProductContentInput,
  type CreateProductInput,
  type CreateProductResult,
  type UpdateProductResult,
} from "./catalog/manage-product";

export {
  createProductBenefit,
  updateProductBenefit,
  deleteProductBenefit,
  type ProductBenefitInput,
  type CreateProductBenefitResult,
} from "./catalog/manage-product-benefit";

export { toggleFavorite, type ToggleFavoriteResult } from "./catalog/manage-favorite";

export { upsertProductAttributes, type ProductAttributeValue } from "./catalog/manage-product-attributes";

export {
  addProductImage,
  deleteProductImage,
  setHeroProductImage,
  setPrimaryProductImage,
  type AddProductImageInput,
  type AddProductImageResult,
} from "./catalog/manage-product-image";

export {
  bulkImportProducts,
  type BulkImportRow,
  type BulkImportRowResult,
  type BulkImportProductsResult,
} from "./catalog/bulk-import-products";

export {
  addProductDocument,
  deleteProductDocument,
  type AddProductDocumentInput,
  type AddProductDocumentResult,
} from "./catalog/manage-product-document";

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

export {
  checkoutDirectItems,
  type CheckoutContext,
  type CheckoutItem,
  type CheckoutResult,
} from "./commerce/checkout";

export {
  initiateOrderPayment,
  type InitiatePaymentOrder,
  type InitiatePaymentResult,
} from "./commerce/initiate-payment";

export {
  processWompiWebhookEvent,
  type ProcessWompiWebhookOutcome,
  type ProcessWompiWebhookResult,
} from "./commerce/process-wompi-webhook";

export { recordAuditLog, type AuditLogEntry } from "./audit/record-audit-log";

export {
  uploadShipment,
  type UploadShipmentInput,
  type UploadShipmentContext,
  type UploadShipmentResult,
} from "./commerce/upload-shipment";

export {
  markOrderDelivered,
  type MarkOrderDeliveredContext,
  type MarkOrderDeliveredResult,
} from "./service/mark-order-delivered";

export {
  requestMaintenance,
  type RequestMaintenanceInput,
  type RequestMaintenanceContext,
  type RequestMaintenanceResult,
} from "./service/request-maintenance";

export {
  createMaintenanceAvailability,
  deleteMaintenanceAvailability,
  type CreateMaintenanceAvailabilityInput,
  type CreateMaintenanceAvailabilityContext,
  type CreateMaintenanceAvailabilityResult,
  type DeleteMaintenanceAvailabilityContext,
} from "./service/manage-maintenance-availability";

export {
  confirmMaintenance,
  rescheduleMaintenance,
  type UpdateMaintenanceStatusResult,
} from "./service/update-maintenance-status";

export {
  completeMaintenance,
  type CompleteMaintenanceInput,
  type CompleteMaintenanceContext,
  type CompleteMaintenanceResult,
} from "./service/complete-maintenance";

export { setMaintenanceInterval, type SetMaintenanceIntervalResult } from "./service/set-maintenance-interval";

export {
  openTicket,
  type OpenTicketInput,
  type OpenTicketContext,
  type OpenTicketResult,
} from "./service/open-ticket";

export {
  replyToTicket,
  type ReplyToTicketInput,
  type ReplyToTicketContext,
  type ReplyToTicketResult,
} from "./service/reply-to-ticket";

export {
  staffReplyToTicket,
  type StaffReplyToTicketInput,
  type StaffReplyToTicketContext,
  type StaffReplyToTicketResult,
} from "./service/staff-reply-to-ticket";

export { updateTicketStatus, type UpdateTicketStatusResult } from "./service/update-ticket-status";

export {
  createCategory,
  updateCategory,
  updateCategoryImage,
  deleteCategory,
  moveCategory,
  type CategoryInput,
  type CategoryContentInput,
  type CreateCategoryResult,
  type UpdateCategoryResult,
  type MoveCategoryDirection,
} from "./catalog/manage-category";

export {
  createBrand,
  updateBrand,
  updateBrandLogo,
  deleteBrand,
  type BrandInput,
  type BrandContentInput,
  type CreateBrandResult,
  type UpdateBrandResult,
} from "./catalog/manage-brand";

export {
  createBanner,
  updateBanner,
  deleteBanner,
  ALLOWED_BANNER_PLACEMENTS,
  type BannerPlacement,
  type BannerInput,
  type CreateBannerInput,
  type CreateBannerResult,
  type UpdateBannerResult,
} from "./content/manage-banner";

export {
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  type PostContentInput,
  type CreatePostResult,
  type UpdatePostResult,
  type PublishPostInput,
} from "./content/manage-post";

export {
  createPromotion,
  updatePromotion,
  ALLOWED_DISCOUNT_TYPES,
  type DiscountType,
  type PromotionInput,
  type CreatePromotionResult,
  type UpdatePromotionResult,
} from "./content/manage-promotion";

export { updateSetting, type UpdateSettingResult } from "./content/manage-setting";

export {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type TestimonialInput,
  type CreateTestimonialResult,
  type UpdateTestimonialResult,
} from "./content/manage-testimonial";

export {
  changeUserRole,
  changeCompanyMemberRole,
  type ChangeUserRoleContext,
  type ChangeMemberRoleInput,
} from "./companies/change-user-role";

export { anonymizeProfile, type AnonymizeProfileContext } from "./companies/anonymize-profile";

export { calculateRoi, type RoiInput, type RoiResult } from "./tools/calculate-roi";
export { calculateLoanPayment, type LoanPaymentInput, type LoanPaymentResult } from "./tools/calculate-loan-payment";

export {
  getDashboardMetrics,
  type DashboardMetricsFilters,
  type DashboardMetrics,
  type StatusCount,
} from "./metrics/get-dashboard-metrics";
