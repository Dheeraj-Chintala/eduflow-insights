import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

// Test users with all valid app_role enum values
const testUsers: TestUser[] = [
  {
    email: 'superadmin@demo.com',
    password: 'superadmin123',
    fullName: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'admin@demo.com',
    password: 'admin123',
    fullName: 'Alice Admin',
    role: 'admin',
  },
  {
    email: 'subadmin@demo.com',
    password: 'subadmin123',
    fullName: 'Sam SubAdmin',
    role: 'sub_admin',
  },
  {
    email: 'trainer@demo.com',
    password: 'trainer123',
    fullName: 'Tom Trainer',
    role: 'trainer',
  },
  {
    email: 'mentor@demo.com',
    password: 'mentor123',
    fullName: 'Maria Mentor',
    role: 'mentor',
  },
  {
    email: 'student@demo.com',
    password: 'student123',
    fullName: 'Steve Student',
    role: 'student',
  },
  {
    email: 'franchise@demo.com',
    password: 'franchise123',
    fullName: 'Frank Franchise',
    role: 'franchise',
  },
  {
    email: 'distributor@demo.com',
    password: 'distributor123',
    fullName: 'Diana Distributor',
    role: 'distributor',
  },
  {
    email: 'superdistributor@demo.com',
    password: 'superdist123',
    fullName: 'Susan SuperDistributor',
    role: 'super_distributor',
  },
  {
    email: 'affiliate@demo.com',
    password: 'affiliate123',
    fullName: 'Andy Affiliate',
    role: 'affiliate',
  },
  {
    email: 'corporatehr@demo.com',
    password: 'corporatehr123',
    fullName: 'Carol HR',
    role: 'corporate_hr',
  },
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting test user seeding...')

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get or create the demo organization
    const orgId = 'a0000000-0000-0000-0000-000000000001'
    
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (!existingOrg) {
      console.log('Creating demo organization...')
      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          id: orgId,
          name: 'Demo Organization',
          slug: 'demo-org',
        })

      if (orgError) {
        console.error('Error creating organization:', orgError)
        throw new Error(`Failed to create organization: ${orgError.message}`)
      }
    }

    const results: { email: string; status: string; error?: string }[] = []

    for (const testUser of testUsers) {
      console.log(`Processing user: ${testUser.email}`)

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === testUser.email)

        let userId: string

        if (existingUser) {
          console.log(`User ${testUser.email} already exists, updating...`)
          userId = existingUser.id
          
          // Update password
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: testUser.password,
          })
        } else {
          console.log(`Creating new user: ${testUser.email}`)
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
          })

          if (createError) {
            throw new Error(`Failed to create auth user: ${createError.message}`)
          }

          userId = newUser.user.id
        }

        // Upsert profile
        console.log(`Upserting profile for ${testUser.email}`)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: userId,
            org_id: orgId,
            full_name: testUser.fullName,
          }, {
            onConflict: 'user_id',
          })

        if (profileError) {
          throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        // Check if role already exists for this user
        console.log(`Checking existing role for ${testUser.email}`)
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('org_id', orgId)
          .eq('role', testUser.role)
          .maybeSingle()

        if (!existingRole) {
          // Insert new role
          console.log(`Inserting role for ${testUser.email}: ${testUser.role}`)
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              org_id: orgId,
              role: testUser.role,
            })

          if (roleError) {
            throw new Error(`Failed to create role: ${roleError.message}`)
          }
        } else {
          console.log(`Role already exists for ${testUser.email}`)
        }

        results.push({
          email: testUser.email,
          status: 'success',
        })

        console.log(`Successfully processed user: ${testUser.email}`)

      } catch (userError) {
        console.error(`Error processing user ${testUser.email}:`, userError)
        results.push({
          email: testUser.email,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error',
        })
      }
    }

    console.log('Seeding complete. Results:', results)

    return new Response(
      JSON.stringify({
        message: 'Test users seeding complete',
        results,
        credentials: testUsers.map(u => ({
          email: u.email,
          password: u.password,
          role: u.role,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Seeding error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
