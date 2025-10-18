import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload as UploadIcon, ArrowLeft, FileText, Image } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;

      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(fileType)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Sirf PDF ya image files upload kar sakte hain (PDF, JPG, PNG)",
        });
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "File size 10MB se kam hona chahiye",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("medical-reports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("medical-reports")
        .getPublicUrl(fileName);

      setProgress(60);

      // Insert report record
      const { data: report, error: insertError } = await supabase
        .from("medical_reports")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgress(70);
      setUploading(false);
      setAnalyzing(true);

      // Analyze report with AI
      const { error: functionError } = await supabase.functions.invoke("analyze-report", {
        body: { fileUrl: publicUrl, fileName: file.name },
      });

      if (functionError) {
        console.error("Analysis error:", functionError);
        toast({
          title: "Uploaded successfully",
          description: "Report upload ho gayi lekin analysis pending hai. Dashboard se check karein.",
        });
      } else {
        toast({
          title: "Success!",
          description: "Mubarak ho! Report upload aur analyze ho gayi hai.",
        });
      }

      setProgress(100);
      setTimeout(() => navigate("/dashboard"), 1000);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Upload failed. Dobara try karein.",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">Upload Medical Report</h1>
            <p className="text-sm text-muted-foreground">Apni medical report upload karein</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Medical Report</CardTitle>
            <CardDescription>
              PDF ya image file upload karein. AI automatically analyze karega.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    {file.type.includes("pdf") ? (
                      <FileText className="h-12 w-12" />
                    ) : (
                      <Image className="h-12 w-12" />
                    )}
                  </div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFile(null)}
                    disabled={uploading || analyzing}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Click to upload file</p>
                  <p className="text-sm text-muted-foreground">PDF, JPG, or PNG (max 10MB)</p>
                  <Input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {(uploading || analyzing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {analyzing ? "Analyzing report..." : "Uploading..."}
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This is an AI-powered analysis tool and should not replace professional medical advice. 
                Ye sirf information ke liye hai, doctor ki salah zaroor lein.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!file || uploading || analyzing}
            >
              {(uploading || analyzing) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {analyzing ? "Analyzing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload and Analyze
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;