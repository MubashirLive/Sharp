import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-soft)" }}>
      <div className="text-center rounded-2xl border bg-card px-8 py-12 shadow-xl max-w-md w-full mx-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center mx-auto mb-5 shadow-lg">
          <span className="text-2xl font-bold text-white">404</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        <a href="/" className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
