import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useLocation, useNavigate } from '@remix-run/react';
import { useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { Image, Money } from '@shopify/hydrogen';
import PriceRangeSlider from '~/components/PriceRangeSlider';
import PriceSortDropdown, { SortDirection } from '~/components/PriceSortDropdown';

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isFirstLoad = !url.searchParams.has('collections') && !url.searchParams.has('products');
  
  const collectionId = url.searchParams.get('collectionId');
  const productCursor = url.searchParams.get('productCursor');
  const searchParams = new URL(request.url).searchParams;
  const cursor = searchParams.get('cursor');
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000');
  const sortDirection = (searchParams.get('sort') as SortDirection) || 'ASC';
  
  // if (collectionId && productCursor) {
  //   const {collection} = await context.storefront.query(PRODUCTS_QUERY, {
  //     variables: {
  //       collectionId,
  //       productsFirst: 3,
  //       productCursor,
  //     },
  //   });
  //   return json({ collection });
  // }


  const collectionsCount = isFirstLoad ? 2 : Number(url.searchParams.get('collections')) || 2;
  const { collections } = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: {
      cursor,
      minPrice,
      maxPrice,
      reverse: sortDirection === 'DESC',
    },
  });

  return json({
    collections: collections.nodes,
    hasMoreCollections: collections.pageInfo.hasNextPage,
    lastCollectionCursor: collections.pageInfo.endCursor,
    currentSort: sortDirection,
  });
}

export default function Collections() {
  const initialData = useLoaderData<typeof loader>();
  const [collections, setCollections] = useState<typeof initialData.collections>(initialData.collections);
  const [hasMore, setHasMore] = useState(initialData.hasMoreCollections);
  const [cursor, setCursor] = useState(initialData.lastCollectionCursor);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialData.currentSort);
  const collectionFetcher = useFetcher();
  const productFetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    setCollections(initialData.collections);
    setHasMore(initialData.hasMoreCollections);
    setCursor(initialData.lastCollectionCursor);
  }, [initialData]);


  useEffect(() => {
    if (collectionFetcher.data?.collections) {
      setCollections(prev => [...prev, ...collectionFetcher.data.collections]);
      setHasMore(collectionFetcher.data.hasMore);
      setCursor(collectionFetcher.data.lastCollectionCursor);
    }
  }, [collectionFetcher.data]);


  useEffect(() => {
    if (productFetcher.data?.collection) {
      setCollections(prev => 
        prev.map(collection => 
          collection.id === productFetcher.data.collection.id
            ? {
                ...collection,
                products: {
                  nodes: [
                    ...collection.products.nodes,
                    ...productFetcher.data.collection.products.nodes
                  ],
                  pageInfo: productFetcher.data.collection.products.pageInfo
                }
              }
            : collection
        )
      );
    }
  }, [productFetcher.data]);

  const showMoreProducts = (collectionId: string, endCursor: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('collectionId', collectionId);
    searchParams.set('productCursor', endCursor);
    // navigate(`?${searchParams.toString()}`, { replace: true });
    productFetcher.load(`?${searchParams.toString()}`);
  };

  const showMoreCollections = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('cursor', cursor);
    searchParams.set('collections', String((collections.length || 0) + 2));
    collectionFetcher.load(`?${searchParams.toString()}`);
  };
  const updateSearchParams = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
    
    searchParams.delete('cursor');
    
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    updateSearchParams({ minPrice: min.toString(), maxPrice: max.toString() });
  };

  const handleSortChange = (direction: SortDirection) => {
    setSortDirection(direction);
    updateSearchParams({ sort: direction });
  };

  const filterProductsByPrice = (products: any[]) => {
    return products.filter((product) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      return price >= priceRange.min && price <= priceRange.max;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-6 mb-8">
      <PriceRangeSlider
        minPrice={0}
        maxPrice={1000}
        onPriceChange={handlePriceChange}
      />
      <PriceSortDropdown
        onSortChange={handleSortChange}
        currentSort={sortDirection}
      />
</div>
      {collections.map((collection) => {
        const filteredProducts = filterProductsByPrice(collection.products.nodes);
        
        return (
          <div key={collection.id} className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{collection.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.handle}`}
                  className="group"
                  prefetch="intent"
                >
                  <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    {product.featuredImage && (
                      <Image
                        data={product.featuredImage}
                        aspectRatio="1/1"
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 100vw"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    )}
                    <h3 className="mt-2 text-lg font-medium">{product.title}</h3>
                    <p className="text-gray-600">
                      <Money data={product.priceRange.minVariantPrice} />
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {collection?.products?.pageInfo?.hasNextPage && (
              <div className="text-center mt-4">
                <button
                  onClick={() => showMoreProducts(
                    collection?.id,
                    collection?.products?.pageInfo?.endCursor
                  )}
                  disabled={productFetcher.state !== 'idle'}
                  className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {productFetcher.state !== 'idle' ? 'Loading...' : 'View More Products'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={showMoreCollections}
            disabled={collectionFetcher.state !== 'idle'}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {collectionFetcher.state !== 'idle' ? 'Loading...' : 'Show More Collections'}
          </button>
        </div>
      )}
    </div>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query Collections(
    $cursor: String
    $minPrice: Float!
    $maxPrice: Float!
    $reverse: Boolean!
  ) {
    collections(first: 2, after: $cursor) {
      nodes {
        id
        title
        handle
        products(
          first: 10
          sortKey: PRICE
          reverse: $reverse
          filters: {
            price: {
              min: $minPrice
              max: $maxPrice
            }
          }
        ) {
          nodes {
            id
            title
            handle
            featuredImage {
              id
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              nodes {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// const PRODUCTS_QUERY = `#graphql
//   query CollectionProducts($collectionId: ID!, $productsFirst: Int!, $productCursor: String) {
//     collection(id: $collectionId) {
//       id
//       products(first: $productsFirst, after: $productCursor) {
//         nodes {
//           id
//           title
//           handle
//           featuredImage {
//             id
//             url
//             altText
//             width
//             height
//           }
//           priceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//         }
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//       }
//     }
//   }
// ` as const;
