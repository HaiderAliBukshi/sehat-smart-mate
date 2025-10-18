import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, LogOut, Activity } from "lucide-react";
import { format } from "date-fns";

interface MedicalReport {
  id: string;
  file_name: string;
  report_date: string;
  created_at: string;
  summary_english: string | null;
  summary_urdu: string | null;
}

const Dashboard = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    fetchReports();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || "User");
      }
    }
  };

  const fetchReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports. Reports load nahi ho sakay.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Khuda Hafiz! Successfully logged out.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              HealthMate
            </h1>
            <p className="text-sm text-muted-foreground">Sehat ka Smart Dost</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">Welcome, {userName}!</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">
              Apni medical reports aur vitals yahan dekhen
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/vitals")}>
              <Activity className="h-4 w-4 mr-2" />
              Vitals
            </Button>
            <Button onClick={() => navigate("/upload")}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-4">
                Abhi tak koi report upload nahi hui
              </p>
              <Button onClick={() => navigate("/upload")}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {report.file_name}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(report.report_date), "MMMM dd, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.summary_english ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {report.summary_english}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Analysis pending...
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;