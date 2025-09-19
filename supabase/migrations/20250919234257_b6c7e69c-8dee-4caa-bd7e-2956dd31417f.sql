-- Create menu categories and items for the sample hotel (fixed)
DO $$
DECLARE
  sample_tenant_id uuid;
  main_course_id uuid;
  drinks_id uuid;
  appetizers_id uuid;
BEGIN
  -- Get the sample tenant
  SELECT tenant_id INTO sample_tenant_id FROM public.tenants WHERE hotel_slug = 'luxury-hotel-lagos' LIMIT 1;
  
  IF sample_tenant_id IS NOT NULL THEN
    -- Create menu categories if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Main Course') THEN
      INSERT INTO public.menu_categories (tenant_id, name, description, display_order, is_active) 
      VALUES (sample_tenant_id, 'Main Course', 'Delicious main dishes', 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Appetizers') THEN
      INSERT INTO public.menu_categories (tenant_id, name, description, display_order, is_active) 
      VALUES (sample_tenant_id, 'Appetizers', 'Light starters and appetizers', 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Drinks') THEN
      INSERT INTO public.menu_categories (tenant_id, name, description, display_order, is_active) 
      VALUES (sample_tenant_id, 'Drinks', 'Beverages and cocktails', 3, true);
    END IF;
    
    -- Get category IDs
    SELECT id INTO main_course_id FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Main Course';
    SELECT id INTO appetizers_id FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Appetizers';
    SELECT id INTO drinks_id FROM public.menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Drinks';
    
    -- Create sample menu items
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE tenant_id = sample_tenant_id AND name = 'Grilled Chicken Breast') THEN
      INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, is_available, preparation_time) 
      VALUES (sample_tenant_id, main_course_id, 'Grilled Chicken Breast', 'Tender grilled chicken with herbs and spices', 2500, true, 15);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE tenant_id = sample_tenant_id AND name = 'Beef Stir Fry') THEN
      INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, is_available, preparation_time) 
      VALUES (sample_tenant_id, main_course_id, 'Beef Stir Fry', 'Fresh beef with vegetables in savory sauce', 3200, true, 12);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE tenant_id = sample_tenant_id AND name = 'Caesar Salad') THEN
      INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, is_available, preparation_time) 
      VALUES (sample_tenant_id, appetizers_id, 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 1200, true, 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE tenant_id = sample_tenant_id AND name = 'Fresh Orange Juice') THEN
      INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, is_available, preparation_time) 
      VALUES (sample_tenant_id, drinks_id, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 500, true, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE tenant_id = sample_tenant_id AND name = 'Nigerian Chapman') THEN
      INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, is_available, preparation_time) 
      VALUES (sample_tenant_id, drinks_id, 'Nigerian Chapman', 'Local Chapman cocktail', 900, true, 3);
    END IF;
    
    -- Create sample supplies with valid categories (housekeeping, kitchen, maintenance)
    IF NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = sample_tenant_id AND name = 'Chicken Breast') THEN
      INSERT INTO public.supplies (tenant_id, name, category, unit, current_stock, minimum_stock, maximum_stock, unit_cost, is_active) 
      VALUES (sample_tenant_id, 'Chicken Breast', 'kitchen', 'kg', 50, 10, 100, 1200, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = sample_tenant_id AND name = 'Orange Juice') THEN
      INSERT INTO public.supplies (tenant_id, name, category, unit, current_stock, minimum_stock, maximum_stock, unit_cost, is_active) 
      VALUES (sample_tenant_id, 'Orange Juice', 'kitchen', 'liter', 25, 5, 50, 300, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = sample_tenant_id AND name = 'Coffee Beans') THEN
      INSERT INTO public.supplies (tenant_id, name, category, unit, current_stock, minimum_stock, maximum_stock, unit_cost, is_active) 
      VALUES (sample_tenant_id, 'Coffee Beans', 'kitchen', 'kg', 15, 3, 30, 2500, true);
    END IF;
  END IF;
END$$;