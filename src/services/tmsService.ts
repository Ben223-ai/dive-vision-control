interface TmsOrderDetailOption {
  isOrLine: boolean;
}

interface TmsOrderDetailRequest {
  gid: string;
  option?: TmsOrderDetailOption;
}

interface TmsOrderDetailResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

interface TmsConfig {
  baseUrl: string;
  token: string;
  authorization?: string;
}

class TmsService {
  private config: TmsConfig | null = null;

  setConfig(config: TmsConfig) {
    this.config = config;
  }

  async getOrderDetail(gid: string, isOrLine: boolean = false): Promise<TmsOrderDetailResponse> {
    if (!this.config) {
      throw new Error('TMS服务未配置');
    }

    if (!gid || gid.length < 1) {
      throw new Error('订单GID不能为空且长度至少为1');
    }

    const requestBody: TmsOrderDetailRequest = {
      gid,
      option: {
        isOrLine
      }
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/v2/OrderSvc/GetDetail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token',
          'Token': this.config.token,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('TMS API调用失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      // 使用一个测试GID来验证连接
      const result = await this.getOrderDetail('test');
      // 即使返回错误，只要能连接到服务器就算成功
      return true;
    } catch (error) {
      console.error('TMS连接测试失败:', error);
      return false;
    }
  }
}

// 创建单例实例
export const tmsService = new TmsService();

// 从localStorage获取配置（如果存在）
const storedConfig = localStorage.getItem('tms-config');
if (storedConfig) {
  try {
    const config = JSON.parse(storedConfig);
    tmsService.setConfig(config);
  } catch (error) {
    console.error('Failed to parse stored TMS config:', error);
  }
}

export default tmsService;