import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AssistantType = 
  | "course_recommendations" 
  | "doubt_clearing" 
  | "skill_gap_analysis" 
  | "mock_interview" 
  | "ats_scoring";

const systemPrompts: Record<AssistantType, string> = {
  course_recommendations: `You are an expert learning advisor for an LMS platform. Based on the student's profile, enrolled courses, progress, and interests, recommend the most relevant courses to help them achieve their learning goals. Be specific and explain why each course would benefit them. Format your response as JSON with the following structure:
{
  "recommendations": [
    { "courseId": "string or null if suggesting new topic", "title": "string", "reason": "string", "matchScore": number 0-100 }
  ],
  "reasoning": "string explaining overall recommendation strategy"
}`,

  doubt_clearing: `You are a helpful AI tutor for an online learning platform. Help students understand concepts clearly, answer their questions about course material, and guide them through problem-solving. Be patient, encouraging, and provide step-by-step explanations when needed. If a question is unclear, ask for clarification. Always relate explanations to practical examples when possible.`,

  skill_gap_analysis: `You are a career development advisor and skill assessment expert. Analyze the student's current skills, completed courses, and career goals to identify skill gaps and recommend learning paths. Provide actionable insights. Format your response as JSON:
{
  "currentSkills": [{ "name": "string", "level": "beginner|intermediate|advanced", "evidence": "string" }],
  "targetRoleRequirements": [{ "skill": "string", "importance": "critical|important|nice-to-have", "currentLevel": "string", "requiredLevel": "string" }],
  "gaps": [{ "skill": "string", "gap": "string", "priority": "high|medium|low" }],
  "recommendations": [{ "action": "string", "resource": "string", "timeframe": "string" }],
  "overallAnalysis": "string"
}`,

  mock_interview: `You are an expert interview coach conducting a mock interview. Based on the job role and interview type, ask relevant questions one at a time. After each response, provide constructive feedback on:
- Content quality and relevance
- Communication clarity
- Confidence indicators (based on response structure)
- Specific suggestions for improvement

For behavioral interviews, use the STAR method. For technical interviews, assess problem-solving approach. Be supportive but honest in your feedback.

Format question responses as JSON:
{ "type": "question", "question": "string", "category": "string", "tips": "string" }

Format feedback responses as JSON:
{ "type": "feedback", "score": number 0-100, "strengths": ["string"], "improvements": ["string"], "suggestion": "string" }`,

  ats_scoring: `You are an ATS (Applicant Tracking System) expert and resume analyst. Analyze the resume against the job description to provide:
1. Overall ATS compatibility score (0-100)
2. Keyword matches found
3. Missing important keywords
4. Format and structure issues
5. Specific improvement suggestions

Format your response as JSON:
{
  "atsScore": number,
  "keywordMatches": [{ "keyword": "string", "found": boolean, "context": "string" }],
  "missingKeywords": ["string"],
  "formatIssues": [{ "issue": "string", "severity": "high|medium|low", "fix": "string" }],
  "suggestions": [{ "priority": "high|medium|low", "suggestion": "string", "impact": "string" }],
  "summary": "string"
}`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Authentication failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const { type, messages, context } = await req.json();
    
    if (!type || !systemPrompts[type as AssistantType]) {
      return new Response(
        JSON.stringify({ error: "Invalid assistant type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Build the system message with context if provided
    let systemContent = systemPrompts[type as AssistantType];
    if (context) {
      systemContent += `\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    }

    const requestMessages = [
      { role: "system", content: systemContent },
      ...(messages || [])
    ];

    console.log(`Processing ${type} request for user ${userId} with ${requestMessages.length} messages`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: requestMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`${type} response generated successfully for user ${userId}`);

    return new Response(
      JSON.stringify({ content, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
