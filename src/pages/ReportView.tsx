import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText, Calendar, Languages } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Report {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  report_date: string;
  summary_english: string | null;
  summary_urdu: string | null;
  created_at: string;
}

const ReportView = () => {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error: any) {
      console.error("Error fetching report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load report. Report load nahi ho saki.",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    {report.file_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.report_date), "MMMM dd, yyyy")}
                    </span>
                    <Badge variant="secondary">{report.file_type.includes("pdf") ? "PDF" : "Image"}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => window.open(report.file_url, "_blank")}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Original File
              </Button>
            </CardContent>
          </Card>

          {report.summary_english || report.summary_urdu ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  AI Analysis / AI Tahleel
                </CardTitle>
                <CardDescription>
                  Bilingual medical report summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="english" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="english">English</TabsTrigger>
                    <TabsTrigger value="urdu">Roman Urdu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="english" className="mt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">
                        {report.summary_english || "Analysis not available yet."}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="urdu" className="mt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">
                        {report.summary_urdu || "Roman Urdu summary abhi available nahi hai."}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  AI is analyzing your report...
                  <br />
                  Aapki report analyze ho rahi hai...
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Medical Disclaimer:</strong> This AI-generated summary is for informational purposes only 
                and should not be considered as medical advice, diagnosis, or treatment. 
                Always consult with qualified healthcare professionals for medical decisions.
                <br /><br />
                <strong>Tib'bi Ikhtiyaati Ehtiyat:</strong> Ye AI summary sirf information ke liye hai. 
                Professional doctor ki salah zaroor lein. Ye medical advice nahi hai.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportView;