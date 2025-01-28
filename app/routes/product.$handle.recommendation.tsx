import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useSearchParams} from '@remix-run/react';
import {PriceFilter} from '~/components/PriceFilter';

export async function loader({params, context, request}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');

  // First, get the product
  const {product} = await storefront.query(GET_PRODUCT_BY_HANDLE, {
    variables: {
      handle,
    },
  });

  if (!product?.id) {
    throw new Response('Product not found', {status: 404});
  }

  let searchQuery = product.productType
    ? `product_type:${product.productType}`
    : '*';

  // Add price filter if provided
  if (minPrice && maxPrice) {
    searchQuery += ` AND variants.price:>=${minPrice} AND variants.price:<=${maxPrice}`;
  }

  const {products} = await storefront.query(SIMILAR_PRODUCTS_QUERY, {
    variables: {
      query: searchQuery,
      first: 4,
    },
  });

  return json({
    product,
    similarProducts: products
  });
}

export default function ProductRecommendation() {
  const {product, similarProducts} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const hasProducts = similarProducts.nodes?.length > 0;

  if (!product) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        
        <div className="mb-6">
          <PriceFilter />
        </div>

        {hasProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.nodes?.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.handle}${searchParams.toString() ? '?' + searchParams.toString() : ''}`}
                className="group"
                prefetch="intent"
              >
                <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  {product.featuredImage && (
                    <img
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                  <h3 className="mt-2 text-lg font-medium">{product.title}</h3>
                  <p className="text-gray-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: product.priceRange.minVariantPrice.currencyCode,
                    }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No products found in this price range.</p>
        )}
      </div>
    </section>
  );
}

const GET_PRODUCT_BY_HANDLE = `#graphql
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      productType
      tags
      vendor
    }
  }
` as const;
// const GET_PRODUCT_BY_HANDLE = `#graphql
//   query getProduct($handle: String!) {
//     product(handle: $handle) {
//       id
//       title
//       productType
//       tags
//     }
//   }
// ` as const;

const SIMILAR_PRODUCTS_QUERY = `#graphql
  query getSimilarProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;