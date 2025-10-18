import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, Languages, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            HealthMate
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-8">Sehat ka Smart Dost</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Your AI-powered health assistant for medical report analysis and health tracking.
            <br />Apka AI sehat saathi jo medical reports analyze karta hai aur health track karta hai.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>Get Started / Shuru Karein</Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Upload Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Upload medical reports (PDF/images) for instant AI analysis. Medical reports upload karein aur AI se analyze karwayein.</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Languages className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Bilingual Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Get summaries in both English and Roman Urdu for easy understanding. English aur Roman Urdu dono me summary hasil karein.</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Record and monitor blood pressure, sugar levels, and weight over time. Blood pressure, sugar aur weight ka record rakhein.</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Your health data is encrypted and kept completely private. Aapka health data mahfooz aur private hai.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;