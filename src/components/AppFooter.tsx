import { Link } from "react-router-dom";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-card py-4 px-4">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} KiDent</p>
        <div className="flex gap-3">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
          <Link to="/conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground mt-2 max-w-lg mx-auto">
        This is an AI-based screening tool for research purposes only. It does not provide medical diagnosis, treatment, or clinical advice.
      </p>
    </footer>
  );
}
