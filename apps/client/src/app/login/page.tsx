"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMockAuth } from "@/lib/mock-auth";
import { mockClients } from "@/data/mock-clients";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@tailfire/ui-public";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useMockAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsLoading(true);
    // Find if this is an existing mock client
    const existingClient = mockClients.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );

    void login(email, name, existingClient?.associatedConsultantId).then(() => {
      setIsLoading(false);
      router.push("/");
    });
  };

  const handleQuickLogin = (client: (typeof mockClients)[0]) => {
    setIsLoading(true);
    void login(client.email, client.name, client.associatedConsultantId).then(() => {
      setIsLoading(false);
      router.push("/");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-phoenix-charcoal flex items-center justify-center">
        <div className="animate-pulse text-phoenix-gold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-phoenix-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Phoenix Voyages"
            width={200}
            height={60}
            className="h-16 w-auto"
          />
        </div>

        <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white font-display">
              Client Portal
            </CardTitle>
            <CardDescription className="text-phoenix-text-muted">
              Sign in to manage your trips and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-phoenix-text-light">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white placeholder:text-phoenix-text-muted"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-phoenix-text-light">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white placeholder:text-phoenix-text-muted"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full btn-phoenix-primary"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Quick login options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-phoenix-gold/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-phoenix-charcoal/50 px-2 text-phoenix-text-muted">
                    Quick login (demo)
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {mockClients.map((client) => (
                  <Button
                    key={client.id}
                    variant="outline"
                    className="w-full border-phoenix-gold/30 text-phoenix-text-light hover:bg-phoenix-gold/10 justify-start"
                    onClick={() => handleQuickLogin(client)}
                    disabled={isLoading}
                  >
                    <span className="truncate">{client.name}</span>
                    <span className="ml-auto text-xs text-phoenix-text-muted truncate">
                      {client.email}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-phoenix-text-muted mt-4">
          This is a demo portal. No real authentication is performed.
        </p>
      </div>
    </div>
  );
}
