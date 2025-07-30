-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  carrier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  weight DECIMAL(10,2),
  volume DECIMAL(10,2)
);

-- Create order tracking events table
CREATE TABLE public.order_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create policies for orders (public access for demo)
CREATE POLICY "Orders are viewable by everyone" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Orders can be created by everyone" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Orders can be updated by everyone" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Create policies for order tracking events (public access for demo)
CREATE POLICY "Order tracking events are viewable by everyone" 
ON public.order_tracking_events 
FOR SELECT 
USING (true);

CREATE POLICY "Order tracking events can be created by everyone" 
ON public.order_tracking_events 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample orders
INSERT INTO public.orders (order_number, customer_name, origin, destination, status, carrier, estimated_delivery, total_amount, weight, volume) VALUES
('TMS2024001', '深圳科技有限公司', '深圳市南山区', '上海市浦东新区', 'in_transit', '顺丰速运', '2024-02-01 14:00:00', 1200.00, 50.5, 2.3),
('TMS2024002', '北京贸易公司', '北京市朝阳区', '广州市天河区', 'delivered', '德邦物流', '2024-01-30 10:00:00', 890.00, 35.2, 1.8),
('TMS2024003', '成都制造企业', '成都市高新区', '西安市雁塔区', 'pending', '中通快递', '2024-02-02 16:00:00', 750.00, 28.7, 1.5),
('TMS2024004', '杭州电商公司', '杭州市西湖区', '南京市建邺区', 'confirmed', '圆通速递', '2024-02-01 12:00:00', 650.00, 22.1, 1.2),
('TMS2024005', '武汉工业集团', '武汉市江汉区', '长沙市岳麓区', 'in_transit', '申通快递', '2024-02-03 09:00:00', 1500.00, 65.3, 3.1);

-- Insert sample tracking events
INSERT INTO public.order_tracking_events (order_id, event_type, description, location, latitude, longitude) VALUES
((SELECT id FROM public.orders WHERE order_number = 'TMS2024001'), 'pickup', '货物已从发货地取件', '深圳市南山区科技园', 22.5431, 113.9344),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024001'), 'transit', '货物运输中，已到达中转站', '广州市白云区物流园', 23.1291, 113.2644),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024001'), 'transit', '货物正在前往目的地', '南昌市经开区', 28.6820, 115.8342),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024002'), 'pickup', '货物已从发货地取件', '北京市朝阳区', 39.9042, 116.4074),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024002'), 'transit', '货物运输中', '石家庄市裕华区', 38.0428, 114.5149),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024002'), 'delivered', '货物已成功送达收货人', '广州市天河区', 23.1167, 113.2500),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024005'), 'pickup', '货物已从发货地取件', '武汉市江汉区', 30.5928, 114.3055);