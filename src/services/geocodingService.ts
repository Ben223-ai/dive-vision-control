// 高德地图地理编码服务
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
    street: string;
    streetNumber: string;
  };
}

class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://restapi.amap.com/v3/geocode';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 地址转坐标 (地理编码)
  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geo?address=${encodeURIComponent(address)}&output=JSON&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.geocodes.length > 0) {
        const result = data.geocodes[0];
        const [lng, lat] = result.location.split(',').map(Number);
        
        return {
          formatted_address: result.formatted_address,
          location: { lng, lat },
          level: result.level
        };
      }
      return null;
    } catch (error) {
      console.error('地理编码失败:', error);
      return null;
    }
  }

  // 坐标转地址 (逆地理编码)
  async reverseGeocode(lng: number, lat: number): Promise<ReverseGeocodeResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/regeo?location=${lng},${lat}&output=JSON&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.regeocode) {
        return {
          formatted_address: data.regeocode.formatted_address,
          addressComponent: data.regeocode.addressComponent
        };
      }
      return null;
    } catch (error) {
      console.error('逆地理编码失败:', error);
      return null;
    }
  }

  // 批量地理编码
  async batchGeocode(addresses: string[]): Promise<GeocodeResult[]> {
    const results = await Promise.all(
      addresses.map(address => this.geocode(address))
    );
    return results.filter(result => result !== null) as GeocodeResult[];
  }
}

export default GeocodingService;
export type { GeocodeResult, ReverseGeocodeResult };