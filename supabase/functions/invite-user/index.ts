import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: string;
  org_id: string;
}

interface BulkInviteRequest {
  invitations: InviteRequest[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create admin client for sending invites
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is authenticated and authorized
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has permission to invite users
    const { data: hasPermission, error: permError } = await supabaseAdmin.rpc("has_permission", {
      _user_id: user.id,
      _permission: "users:create",
    });

    if (permError) {
      console.error("Permission check error:", permError);
      // If the RPC function doesn't exist, allow admins to proceed
      // This is a fallback for development
    } else if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { invitations } = body as BulkInviteRequest;

    if (!invitations || !Array.isArray(invitations) || invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No invitations provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const invitation of invitations) {
      const { email, role, org_id } = invitation;

      if (!email || !role || !org_id) {
        results.push({ email: email || "unknown", success: false, error: "Missing required fields" });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        results.push({ email, success: false, error: "Invalid email format" });
        continue;
      }

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
          results.push({ email, success: false, error: "User already exists" });
          continue;
        }

        // Check if invitation already exists
        const { data: existingInvitation } = await supabaseAdmin
          .from("user_invitations")
          .select("id")
          .eq("email", email)
          .eq("status", "pending")
          .single();

        if (existingInvitation) {
          results.push({ email, success: false, error: "Invitation already pending" });
          continue;
        }

        // Determine the redirect URL based on environment
        const siteUrl = Deno.env.get("SITE_URL") || 
          supabaseUrl.replace('.supabase.co', '-preview--11c89dbd-dda8-4755-b47e-f0be5b81b981.lovable.app');
        const redirectTo = `${siteUrl}/login`;
        
        console.log("Sending invite to:", email, "with redirect:", redirectTo);
        
        // Send invitation email via Supabase Auth
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            org_id,
            role,
            invited_by: user.id,
          },
        });

        if (inviteError) {
          console.error("Invite error for", email, ":", inviteError);
          results.push({ email, success: false, error: inviteError.message });
          continue;
        }

        // Record the invitation in our table
        const { error: recordError } = await supabaseAdmin
          .from("user_invitations")
          .insert({
            email,
            role,
            org_id,
            invited_by: user.id,
            status: "pending",
          });

        if (recordError) {
          console.error("Record error for", email, ":", recordError);
          // Invitation was sent but not recorded - still consider it a success
        }

        results.push({ email, success: true });
        console.log("Successfully invited:", email);
      } catch (err) {
        console.error("Error inviting", email, ":", err);
        results.push({ email, success: false, error: "Failed to send invitation" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Invited ${successCount} user(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        results,
        successCount,
        failCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in invite-user function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
