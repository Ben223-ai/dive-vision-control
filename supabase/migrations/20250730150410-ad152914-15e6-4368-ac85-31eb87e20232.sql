-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  carrier TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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
  event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a tracking system)
CREATE POLICY "Orders are publicly viewable" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Order tracking events are publicly viewable" 
ON public.order_tracking_events 
FOR SELECT 
USING (true);

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
INSERT INTO public.orders (order_number, origin, destination, status, carrier, estimated_delivery, progress) VALUES
('ORD-2024-001', '上海市浦东新区', '北京市朝阳区', 'in_transit', '顺丰速运', '2024-01-31 14:00:00+08', 65),
('ORD-2024-002', '广州市天河区', '深圳市南山区', 'delivered', '德邦物流', '2024-01-30 10:00:00+08', 100),
('ORD-2024-003', '杭州市西湖区', '苏州市工业园区', 'pending', '中通快递', '2024-02-01 16:00:00+08', 0),
('ORD-2024-004', '成都市锦江区', '重庆市渝北区', 'in_transit', '京东物流', '2024-01-31 18:00:00+08', 40),
('ORD-2024-005', '武汉市武昌区', '长沙市岳麓区', 'out_for_delivery', '圆通速递', '2024-01-30 20:00:00+08', 90);

-- Insert sample tracking events
INSERT INTO public.order_tracking_events (order_id, event_type, description, location, event_time) VALUES
((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-001'), 'pickup', '货物已取件', '上海市浦东新区', '2024-01-29 09:00:00+08'),
((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-001'), 'in_transit', '货物运输中', '南京市', '2024-01-29 18:00:00+08'),
((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-001'), 'arrived_at_facility', '货物到达分拣中心', '北京市', '2024-01-30 08:00:00+08'),
((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-002'), 'pickup', '货物已取件', '广州市天河区', '2024-01-28 10:00:00+08'),
((SELECT id FROM public.orders WHERE order_number = 'ORD-2024-002'), 'delivered', '货物已签收', '深圳市南山区', '2024-01-30 10:00:00+08');