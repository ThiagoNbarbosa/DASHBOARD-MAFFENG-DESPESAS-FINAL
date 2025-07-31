import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import type { LoginData } from "@shared/schema";
// Logo MAFFENG Original
const MAFFENGLogo = () => (
  <img src="/assets/logo-maffeng-original.png" alt="MAFFENG Logo" className="h-full w-full object-contain" />
);

export default function Login() {
  const [credentials, setCredentials] = useState<LoginData>({
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-48 w-64 flex items-center justify-center">
            <MAFFENGLogo />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  placeholder="Digite seu email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  placeholder="Digite sua senha"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-medium text-amber-800 mb-2">
                ⚠️ Aplicativo Restrito
              </h3>
              <div className="text-xs text-amber-700">
                O aplicativo é restrito a usuários autorizados.
                Por favor, entre em contato com o desenvolvedor se precisar de acesso.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
