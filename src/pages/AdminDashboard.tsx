import { useProducts } from '@/hooks/useProduct';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { data: products, isLoading } = useProducts();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const lines = ['Classic', 'Sparkling', 'No Regrets'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-admin font-semibold text-foreground">
            Brand Platform
          </h1>
          <p className="text-xs text-muted-foreground">Classy Cocktails · PIM</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {lines.map((line) => {
              const lineProducts = products?.filter((p) => p.line === line) || [];
              if (lineProducts.length === 0) return null;
              return (
                <section key={line}>
                  <h2 className="text-sm font-admin font-semibold text-primary tracking-wide uppercase mb-3">
                    {line}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lineProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/admin/product/${product.slug}`}
                        className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-admin font-medium text-card-foreground">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {product.abv}% ABV · {product.serving}
                            </p>
                          </div>
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: product.bottle_color || '#333' }}
                          />
                        </div>

                        {/* Completeness bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Completeness</span>
                            <span>{product.completeness}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${product.completeness}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Quick preview link */}
            <section className="border-t border-border pt-6">
              <h2 className="text-sm font-admin font-semibold text-muted-foreground tracking-wide uppercase mb-3">
                Consumer Preview
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                Preview the DPP as consumers see it
              </p>
              <div className="flex flex-wrap gap-2">
                {products?.map((p) => (
                  <Link
                    key={p.id}
                    to={`/bottle/${p.slug}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline font-admin"
                  >
                    {p.name} ↗
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
