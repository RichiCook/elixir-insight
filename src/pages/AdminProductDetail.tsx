import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProduct, useProducts, useCollaboration } from '@/hooks/useProduct';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getCompletenessColor, getLineBadge } from '@/constants/app';
import { LayoutTab } from '@/components/admin/LayoutTab';
import { GeneralTab } from '@/components/admin/product/GeneralTab';
import { LanguagesTab } from '@/components/admin/product/LanguagesTab';
import { TechnicalTab } from '@/components/admin/product/TechnicalTab';
import { EanTab } from '@/components/admin/product/EanTab';
import { ImagesTab } from '@/components/admin/product/ImagesTab';
import { PairingsTab } from '@/components/admin/product/PairingsTab';
import { LivePreviewPanel } from '@/components/admin/product/LivePreviewPanel';
import { useBrandStore } from '@/stores/brandStore';

export default function AdminProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: products } = useProducts();
  const { data: collab } = useCollaboration(product?.id);
  const queryClient = useQueryClient();
  const activeBrand = useBrandStore((s) => s.activeBrand);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1280);

  useEffect(() => {
    const handler = () => setIsWideScreen(window.innerWidth >= 1280);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const invalidateProduct = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
    (window as any).__refreshPreview?.();
  }, [queryClient, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar */}
      <aside className="w-60 border-r border-border bg-card overflow-y-auto shrink-0">
        <div className="p-3 border-b border-border">
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>
        <nav className="py-1">
          {products?.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/product/${p.slug}`)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                p.slug === slug ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getCompletenessColor(p.completeness || 0) }}
              />
              <span className="truncate flex-1">{p.name}</span>
              <span className={`text-[8px] uppercase px-1 py-0.5 rounded ${getLineBadge(p.line)}`}>
                {p.line === 'No Regrets' ? 'NR' : p.line === 'Sparkling' ? 'SP' : 'CL'}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main editor */}
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-[28px] font-normal text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${product.completeness}%`, backgroundColor: getCompletenessColor(product.completeness || 0) }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{product.completeness}%</span>
            </div>
          </div>
          {!isWideScreen && (
            <a href={`/b/${activeBrand?.slug ?? 'classy'}/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Preview ↗</Button>
            </a>
          )}
        </header>

        <div className="p-6 max-w-4xl">
          {collab && (
            <div className="mb-4 rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: (collab.brand_color || '#333') + '15', borderLeft: `4px solid ${collab.brand_color || '#333'}` }}>
              {collab.brand_logo_url ? (
                <img src={collab.brand_logo_url} alt="" className="w-6 h-6 rounded object-contain" />
              ) : (
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: collab.brand_color || '#333', color: '#fff' }}>
                  {collab.brand_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-foreground font-medium">Collaboration: {collab.brand_name}</p>
                {collab.event_name && <p className="text-[10px] text-muted-foreground">{collab.event_name}</p>}
              </div>
              <Link to={`/admin/collaborations/${collab.brand_slug}`} className="ml-auto text-[10px] text-primary hover:underline">View Collab →</Link>
            </div>
          )}

          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="technical">Technical Data</TabsTrigger>
              <TabsTrigger value="ean">EAN Codes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="pairings">Pairings</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralTab product={product} onSave={invalidateProduct} />
            </TabsContent>
            <TabsContent value="languages">
              <LanguagesTab productId={product.id} productName={product.name} />
            </TabsContent>
            <TabsContent value="technical">
              <TechnicalTab productId={product.id} />
            </TabsContent>
            <TabsContent value="ean">
              <EanTab productId={product.id} />
            </TabsContent>
            <TabsContent value="images">
              <ImagesTab productId={product.id} />
            </TabsContent>
            <TabsContent value="pairings">
              <PairingsTab productId={product.id} />
            </TabsContent>
            <TabsContent value="layout">
              <LayoutTab productId={product.id} onSave={invalidateProduct} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {isWideScreen && <LivePreviewPanel slug={product.slug} brandSlug={activeBrand?.slug ?? 'classy'} />}
    </div>
  );
}
