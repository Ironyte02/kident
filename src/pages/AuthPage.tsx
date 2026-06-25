import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import kidentLogo from "@/assets/kident-logo.png";
import AnimatedBackground from "@/components/AnimatedBackground";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative transition-colors duration-500">
      <AnimatedBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-elevated relative z-[2] border-border/60">
        <CardHeader className="text-center space-y-3 pb-4">
          <img
            src={kidentLogo}
            alt="KiDent — Care Today, Smile Forever"
            className="w-44 h-auto mx-auto animate-bounce-in"
          />
          <p className="text-muted-foreground text-sm italic font-serif">{t.auth.parentAccount}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder={t.auth.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {!isLogin && (
              <Input
                type="password"
                placeholder={t.auth.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.common.loading : isLogin ? t.auth.login : t.auth.register}
            </Button>
          </form>

          <button
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t.auth.noAccount : t.auth.hasAccount}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
