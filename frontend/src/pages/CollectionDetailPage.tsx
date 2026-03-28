import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Layers3, Sparkles } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { publicCollectionsAPI, toMediaUrl } from '../services/api';
import type { Collection, Product } from '../types';

type CollectionResponse = Collection & {
  products?: Product[];
};

const normalizeProduct = (product: Product): Product => ({
  ...product,
  id: String(product.id),
  product_images: (product.product_images || []).map((image) => ({
    ...image,
    id: String(image.id),
    product_id: String(image.product_id),
    url: toMediaUrl(image.url)
  })),
  product_variants: (product.product_variants || []).map((variant) => ({
    ...variant,
    id: String(variant.id),
    product_id: String(variant.product_id)
  }))
});

export default function CollectionDetailPage() {
  const { slug = '' } = useParams();
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCollection = async () => {
      setIsLoading(true);
      setNotFound(false);

      try {
        const response = await publicCollectionsAPI.getBySlug(slug);
        if (!isMounted) return;

        const payload = response.data.data as CollectionResponse;
        setCollection({
          ...payload,
          image: toMediaUrl(payload.image),
          products: (payload.products || []).map(normalizeProduct)
        });
      } catch (error: any) {
        if (!isMounted) return;

        if (error.response?.status === 404) {
          setNotFound(true);
        }

        setCollection(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCollection();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const heroImage = useMemo(
    () =>
      collection?.image ||
      collection?.products?.[0]?.product_images?.[0]?.url ||
      'https://placehold.co/1400x900/e9dfcf/1f2937?text=Collection',
    [collection]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] transition-colors duration-300 dark:bg-[#0c111b]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-black/5 dark:bg-[#111827] dark:ring-white/10">
            <div className="h-[420px] bg-[#e9e2d6] dark:bg-[#1b2536]" />
            <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="h-4 w-28 rounded-full bg-[#ece4d7] dark:bg-[#243147]" />
                <div className="h-10 w-2/3 rounded-full bg-[#ece4d7] dark:bg-[#243147]" />
                <div className="h-4 w-full rounded-full bg-[#f1eadf] dark:bg-[#1f2a3d]" />
                <div className="h-4 w-4/5 rounded-full bg-[#f1eadf] dark:bg-[#1f2a3d]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-[1.75rem] bg-[#f1eadf] dark:bg-[#1f2a3d]" />
                <div className="h-32 rounded-[1.75rem] bg-[#f1eadf] dark:bg-[#1f2a3d]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] transition-colors duration-300 dark:bg-[#0c111b]">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#8c734b] shadow-sm ring-1 ring-black/5 dark:bg-[#111827] dark:text-[#d2b47c] dark:ring-white/10">
            <Layers3 className="h-7 w-7" />
          </span>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#8c734b] dark:text-[#d2b47c]">
            Không tìm thấy
          </p>
          <h1 className="text-4xl font-semibold text-secondary-900 dark:text-white">
            Bộ sưu tập không tồn tại hoặc đang tạm ẩn.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-secondary-600 dark:text-slate-300">
            Thử quay lại cửa hàng để xem các nhóm sản phẩm đang mở bán hoặc những phân loại nổi bật khác.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/shop" className="btn btn-primary rounded-full px-6">
              Về cửa hàng
            </Link>
            <Link
              to="/"
              className="btn rounded-full border border-black/10 bg-white px-6 text-secondary-800 dark:border-white/10 dark:bg-[#111827] dark:text-white"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${collection.name} | Bộ sưu tập`}</title>
        <meta
          name="description"
          content={collection.description || `Khám phá bộ sưu tập ${collection.name} tại ShopEase.`}
        />
      </Helmet>

      <div className="bg-[#f8f5ee] text-secondary-900 transition-colors duration-300 dark:bg-[#0c111b] dark:text-white">
        <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              to="/shop"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-secondary-600 transition hover:text-secondary-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại cửa hàng
            </Link>

            <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-black/5 dark:bg-[#111827] dark:ring-white/10">
              <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                <div className="relative min-h-[420px] overflow-hidden lg:min-h-[620px]">
                  <img src={heroImage} alt={collection.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                  <div className="relative flex h-full flex-col justify-between p-8 text-white md:p-12">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Bộ sưu tập chọn lọc
                      </span>
                    </div>

                    <div className="max-w-2xl">
                      <h1 className="text-4xl font-semibold leading-tight md:text-6xl">{collection.name}</h1>
                      {collection.description && (
                        <p className="mt-5 max-w-xl text-sm leading-7 text-white/82 md:text-base">
                          {collection.description}
                        </p>
                      )}
                      <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
                        <div>
                          <p className="text-3xl font-semibold">{collection.product_count || collection.products?.length || 0}</p>
                          <p className="mt-1 uppercase tracking-[0.26em] text-white/60">Sản phẩm</p>
                        </div>
                        <div className="h-12 w-px bg-white/15" />
                        <div className="max-w-xs text-white/72">
                          Phân loại này dùng để gom sản phẩm theo chủ đề mua sắm và cách phối đồ rõ ràng hơn.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
                  <div className="rounded-[2rem] border border-black/8 bg-[#f5f1e8] p-6 dark:border-white/10 dark:bg-[#171f2d]">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c734b] dark:text-[#d2b47c]">
                      Gợi ý nhanh
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight dark:text-white">
                      Bắt đầu từ những món có thể phối ngay.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-secondary-600 dark:text-slate-300">
                      Trang bộ sưu tập này gom các sản phẩm đang hoạt động trong cùng một chủ đề để người mua xem nhanh
                      và đi thẳng vào chi tiết sản phẩm.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link to="/shop" className="btn btn-primary rounded-full px-5">
                        Xem tất cả sản phẩm
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {(collection.products || []).slice(0, 4).map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}`}
                        className="group overflow-hidden rounded-[1.75rem] bg-[#f5f1e8] p-3 transition hover:bg-[#efe7da] dark:bg-[#171f2d] dark:hover:bg-[#1d2737]"
                      >
                        <div className="aspect-[4/4.8] overflow-hidden rounded-[1.25rem] bg-[#e8dece] dark:bg-[#243147]">
                          <img
                            src={product.product_images?.[0]?.url || 'https://placehold.co/600x700/e5ddd0/1f2937?text=Product'}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        </div>
                        <div className="pt-4">
                          <p className="line-clamp-2 text-sm font-semibold text-secondary-900 dark:text-white">{product.name}</p>
                          <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8c734b] dark:text-[#d2b47c]">
                            Mở sản phẩm
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c734b] dark:text-[#d2b47c]">
                  Danh sách bộ sưu tập
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl dark:text-white">
                  Tất cả sản phẩm trong bộ sưu tập này.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-secondary-600 dark:text-slate-300 md:text-right">
                Chọn từng sản phẩm để xem chi tiết, giá bán, biến thể và tồn kho hiện tại.
              </p>
            </div>

            {collection.products && collection.products.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {collection.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-black/10 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#111827]">
                <h3 className="text-2xl font-semibold text-secondary-900 dark:text-white">Bộ sưu tập này chưa có sản phẩm.</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-secondary-600 dark:text-slate-300">
                  Admin có thể vào trang quản trị collection để gắn thêm sản phẩm vào nhóm này.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
