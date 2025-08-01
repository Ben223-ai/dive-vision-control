-- Add custom_fields column to orders table for storing dynamic form data
ALTER TABLE public.orders ADD COLUMN custom_fields jsonb DEFAULT '{}';

-- Create index for better performance on custom_fields queries
CREATE INDEX idx_orders_custom_fields ON public.orders USING GIN(custom_fields);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.custom_fields IS 'Stores dynamic form field data as JSON';