import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'File URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing medical report:', fileName);

    // Call Lovable AI Gateway with Gemini for multimodal analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical report analyzer. Analyze medical reports and provide clear, bilingual summaries.
            
CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "english": "Clear, concise summary of key findings, test results, and recommendations",
  "romanUrdu": "Roman Urdu me medical report ka mukhtasir bayaan. Test results aur zaroori baatain shamil karein"
}

Rules:
- Keep summaries factual and clear
- Highlight abnormal values
- Use simple medical terminology
- Roman Urdu should be easy to read (e.g., "Blood pressure zyada hai" not complex medical terms)
- Do not add any text outside the JSON object`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this medical report: ${fileName}\nProvide bilingual summary (English and Roman Urdu).`
              },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl
                }
              }
            ]
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Thodi der baad dobara try karein.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let summaries;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      summaries = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      // Fallback: try to extract summaries from text
      summaries = {
        english: content.substring(0, 500),
        romanUrdu: 'Report ka tafseel English me dekhen.'
      };
    }

    console.log('Analysis complete');

    return new Response(
      JSON.stringify({
        summaryEnglish: summaries.english || 'Summary not available',
        summaryUrdu: summaries.romanUrdu || 'Roman Urdu summary nahi mil saka'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});