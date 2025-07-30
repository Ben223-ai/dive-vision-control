-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN customer_name TEXT,
ADD COLUMN total_amount DECIMAL(10,2),
ADD COLUMN weight DECIMAL(10,2),
ADD COLUMN volume DECIMAL(10,2);

-- Update existing records with sample data
UPDATE public.orders SET 
  customer_name = CASE order_number
    WHEN 'TMS2024001' THEN '深圳科技有限公司'
    WHEN 'TMS2024002' THEN '北京贸易公司'
    WHEN 'TMS2024003' THEN '成都制造企业'
    WHEN 'TMS2024004' THEN '杭州电商公司'
    WHEN 'TMS2024005' THEN '武汉工业集团'
    ELSE '客户公司'
  END,
  total_amount = CASE order_number
    WHEN 'TMS2024001' THEN 1200.00
    WHEN 'TMS2024002' THEN 890.00
    WHEN 'TMS2024003' THEN 750.00
    WHEN 'TMS2024004' THEN 650.00
    WHEN 'TMS2024005' THEN 1500.00
    ELSE 500.00
  END,
  weight = CASE order_number
    WHEN 'TMS2024001' THEN 50.5
    WHEN 'TMS2024002' THEN 35.2
    WHEN 'TMS2024003' THEN 28.7
    WHEN 'TMS2024004' THEN 22.1
    WHEN 'TMS2024005' THEN 65.3
    ELSE 30.0
  END,
  volume = CASE order_number
    WHEN 'TMS2024001' THEN 2.3
    WHEN 'TMS2024002' THEN 1.8
    WHEN 'TMS2024003' THEN 1.5
    WHEN 'TMS2024004' THEN 1.2
    WHEN 'TMS2024005' THEN 3.1
    ELSE 2.0
  END;