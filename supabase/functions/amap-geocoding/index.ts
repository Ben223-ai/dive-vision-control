import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResult {
  formatted_address: string;
  location: {
    lng: number;
    lat: number;
  };
  level: string;
}

interface ReverseGeocodeResult {
  formatted_address: string;
  addressComponent: {
    province: string;
    city: string;
    district: string;
    street: string | { name?: string };
    streetNumber: string | { number?: string };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, address, coordinates, apiKey } = await req.json();
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let result = null;

    if (type === 'geocode' && address) {
      // 地址转坐标 (地理编码)
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&output=JSON&key=${apiKey}`
      );
      
      const data = await response.json();
      console.log('Geocoding API response:', data);
      
      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const geocode = data.geocodes[0];
        const [lng, lat] = geocode.location.split(',').map(Number);
        
        result = {
          formatted_address: geocode.formatted_address,
          location: { lng, lat },
          level: geocode.level
        } as GeocodeResult;
      }
    } else if (type === 'reverse' && coordinates) {
      // 坐标转地址 (逆地理编码)
      const { lng, lat } = coordinates;
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&output=JSON&key=${apiKey}`
      );
      
      const data = await response.json();
      console.log('Reverse geocoding API response:', data);
      
      if (data.status === '1' && data.regeocode) {
        result = {
          formatted_address: data.regeocode.formatted_address,
          addressComponent: data.regeocode.addressComponent
        } as ReverseGeocodeResult;
      }
    } else if (type === 'weather' && coordinates) {
      // 天气查询
      const { adcode } = coordinates;
      const response = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode || '110000'}&key=${apiKey}`
      );
      
      const data = await response.json();
      console.log('Weather API response:', data);
      
      if (data.status === '1' && data.lives && data.lives.length > 0) {
        result = data.lives[0];
      }
    } else if (type === 'traffic' && coordinates) {
      // 路况查询
      const { lng, lat } = coordinates;
      const response = await fetch(
        `https://restapi.amap.com/v3/traffic/status/rectangle?rectangle=${lng-0.01},${lat-0.01};${lng+0.01},${lat+0.01}&key=${apiKey}`
      );
      
      const data = await response.json();
      console.log('Traffic API response:', data);
      
      if (data.status === '1') {
        result = data.trafficinfo || { status: 'normal', description: '路况正常' };
      }
    }

    if (result) {
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'No results found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in amap-geocoding function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});