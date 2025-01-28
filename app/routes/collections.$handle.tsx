import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction, useNavigate, useLocation} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {useState, useEffect} from 'react';
import { PriceFilter } from '~/components/PriceFilter';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader({context, params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');

  // Convert price strings to numbers and multiply by 100 for cents
  const minPriceInCents = minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined;
  const maxPriceInCents = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined;

  const deferredData = loadDeferredData({context, params, request});
  const criticalData = await loadCriticalData({
    context,
    params,
    request,
    minPrice: minPriceInCents,
    maxPrice: maxPriceInCents,
  });

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  params,
  request,
  minPrice,
  maxPrice,
}: LoaderFunctionArgs & {
  minPrice?: number;
  maxPrice?: number;
}) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  // Debug log the query variables
  const queryVariables = {
    handle,
    ...paginationVariables,
    minPrice: minPrice ? minPrice : null,
    maxPrice: maxPrice ? maxPrice : null,
  };
  

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: queryVariables,
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }


  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <div className="p-6">
        {/* Header section with title, description, and filter */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{collection.title}</h1>
          <div className="flex justify-between items-center gap-8">
            <p className="collection-description flex-grow">
              {collection.description}
            </p>
            <div className="w-72"> {/* Fixed width for the filter */}
              <PriceFilter />
            </div>
          </div>
        </div>

        {/* Products grid */}
        <PaginatedResourceSection
          connection={collection.products}
          resourcesClassName="grid grid-cols-4 gap-6"
        >
          {({node: product, index}) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </div>
      
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        price {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $minPrice: Float
    $maxPrice: Float
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: PRICE,
        filters: {
          price: {
            min: $minPrice
            max: $maxPrice
          }
          available: true
        }
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
