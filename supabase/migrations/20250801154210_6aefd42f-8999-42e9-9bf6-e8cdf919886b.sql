-- 为delivery_predictions表添加外键关系
ALTER TABLE public.delivery_predictions
ADD CONSTRAINT fk_delivery_predictions_order_id
FOREIGN KEY (order_id) REFERENCES public.orders(id)
ON DELETE CASCADE;