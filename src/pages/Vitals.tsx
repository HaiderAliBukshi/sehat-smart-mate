import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Activity, Plus } from "lucide-react";
import { format } from "date-fns";

interface Vital {
  id: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  blood_sugar: number | null;
  weight: number | null;
  notes: string | null;
  recorded_at: string;
}

const Vitals = () => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    systolic: "",
    diastolic: "",
    sugar: "",
    weight: "",
    notes: "",
  });

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vitals")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      setVitals(data || []);
    } catch (error: any) {
      console.error("Error fetching vitals:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vitals. Vitals load nahi ho sakay.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("vitals").insert({
        user_id: user.id,
        blood_pressure_systolic: formData.systolic ? parseInt(formData.systolic) : null,
        blood_pressure_diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        blood_sugar: formData.sugar ? parseFloat(formData.sugar) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Vitals saved successfully. Vitals save ho gayi hain.",
      });

      setFormData({
        systolic: "",
        diastolic: "",
        sugar: "",
        weight: "",
        notes: "",
      });
      setShowForm(false);
      fetchVitals();
    } catch (error: any) {
      console.error("Error saving vitals:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save vitals. Dobara try karein.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Health Vitals</h1>
              <p className="text-sm text-muted-foreground">Apni sehat ka record rakhein</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vitals
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Record New Vitals</CardTitle>
              <CardDescription>Enter your health measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Pressure (Systolic)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={formData.systolic}
                      onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Pressure (Diastolic)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={formData.diastolic}
                      onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Sugar (mg/dL)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={formData.sugar}
                      onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="70"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Koi khas baat ya feeling..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Vitals
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vitals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Vitals Recorded</h3>
              <p className="text-muted-foreground mb-4">
                Abhi tak vitals record nahi hui hain
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Your First Vitals
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vitals.map((vital) => (
              <Card key={vital.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    {format(new Date(vital.recorded_at), "MMMM dd, yyyy 'at' h:mm a")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Pressure</p>
                        <p className="text-lg font-semibold">
                          {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                        </p>
                      </div>
                    )}
                    {vital.blood_sugar && (
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Sugar</p>
                        <p className="text-lg font-semibold">{vital.blood_sugar} mg/dL</p>
                      </div>
                    )}
                    {vital.weight && (
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="text-lg font-semibold">{vital.weight} kg</p>
                      </div>
                    )}
                  </div>
                  {vital.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{vital.notes}</p>
                    </div>
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

export default Vitals;