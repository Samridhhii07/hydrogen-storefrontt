import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useLocation, useNavigate } from '@remix-run/react';
import { useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { Image, Money } from '@shopify/hydrogen';

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isFirstLoad = !url.searchParams.has('collections') && !url.searchParams.has('products');
  
  const collectionId = url.searchParams.get('collectionId');
  const productCursor = url.searchParams.get('productCursor');
  
  if (collectionId && productCursor) {
    const {collection} = await context.storefront.query(PRODUCTS_QUERY, {
      variables: {
        collectionId,
        productsFirst: 3,
        productCursor,
      },
    });
    return json({ collection });
  }


  const collectionsCount = isFirstLoad ? 2 : Number(url.searchParams.get('collections')) || 2;
  const cursor = url.searchParams.get('cursor');

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: {
      collectionsFirst: collectionsCount,
      productsFirst: 3,
      cursor: cursor || null,
    },
  });

  return json({
    collections: collections.nodes,
    hasMoreCollections: collections.pageInfo.hasNextPage,
    lastCollectionCursor: collections.pageInfo.endCursor,
  });
}

export default function Collections() {
  const initialData = useLoaderData<typeof loader>();
  const [collections, setCollections] = useState<typeof initialData.collections>(initialData.collections);
  const [hasMore, setHasMore] = useState(initialData.hasMoreCollections);
  const [cursor, setCursor] = useState(initialData.lastCollectionCursor);
  const collectionFetcher = useFetcher();
  const productFetcher = useFetcher();


  useEffect(() => {
    setCollections(initialData.collections);
    setHasMore(initialData.hasMoreCollections);
    setCursor(initialData.lastCollectionCursor);
  }, [initialData]);


  useEffect(() => {
    if (collectionFetcher.data?.collections) {
      setCollections(prev => [...prev, ...collectionFetcher.data.collections]);
      setHasMore(collectionFetcher.data.hasMoreCollections);
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
    productFetcher.load(`?${searchParams.toString()}`);
    // navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const showMoreCollections = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('cursor', cursor);
    searchParams.set('collections', String((collections.length || 0) + 2));
    collectionFetcher.load(`?${searchParams.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {collections.map((collection) => (
        <div key={collection.id} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{collection.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {collection.products.nodes.map((product) => (
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

          {collection.products.pageInfo.hasNextPage && (
            <div className="text-center mt-4">
              <button
                onClick={() => showMoreProducts(
                  collection.id,
                  collection.products.pageInfo.endCursor
                )}
                disabled={productFetcher.state !== 'idle'}
                className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {productFetcher.state !== 'idle' ? 'Loading...' : 'View More Products'}
              </button>
            </div>
          )}
        </div>
      ))}

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
  query CollectionsWithProducts($collectionsFirst: Int!, $productsFirst: Int!, $cursor: String) {
    collections(first: $collectionsFirst, after: $cursor) {
      nodes {
        id
        title
        handle
        description
        products(first: $productsFirst) {
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
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

const PRODUCTS_QUERY = `#graphql
  query CollectionProducts($collectionId: ID!, $productsFirst: Int!, $productCursor: String) {
    collection(id: $collectionId) {
      id
      products(first: $productsFirst, after: $productCursor) {
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
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
` as const;
