import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { SignJWT } from 'https://deno.land/x/jose@v4.15.1/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GenerateTokenRequest {
  userId: string;
  permissions: string[];
  expirationHours?: number;
}

interface GenerateTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: '只允许POST请求' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'JWT_SECRET未配置' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestBody: GenerateTokenRequest = await req.json();
    console.log('Generate JWT token request:', requestBody);

    // Validate required fields
    if (!requestBody.userId || !requestBody.permissions || requestBody.permissions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必要字段: userId, permissions' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expirationHours = requestBody.expirationHours || 24;
    const exp = now + (expirationHours * 3600);

    // Create JWT token
    const token = await new SignJWT({
      sub: requestBody.userId,
      permissions: requestBody.permissions,
      iat: now,
      exp: exp
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(jwtSecret));

    console.log('JWT token generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        token: token
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating JWT token:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '生成JWT Token失败' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});