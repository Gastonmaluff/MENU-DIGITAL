const imageAliases = ['imageUrl', 'image', 'imageSrc', 'photoUrl', 'photo', 'img', 'thumbnail', 'demoImage'];
const featuredImageAliases = ['featuredImageUrl', 'featuredImage', 'heroImageUrl', 'heroImage', 'coverImageUrl'];

const firstString = (source, keys) =>
  keys.map((key) => source?.[key]).find((value) => typeof value === 'string' && value.trim());

export const getProductImageUrl = (product) => firstString(product, imageAliases) || '';

export const getProductFeaturedImageUrl = (product) => firstString(product, featuredImageAliases) || '';

export const normalizeProductImageFields = (product) => ({
  ...product,
  imageUrl: getProductImageUrl(product),
  featuredImageUrl: getProductFeaturedImageUrl(product),
});
