insert into customers (id, name) values ('cust_a','Returning Customer A'), ('cust_b','New Customer B')
  on conflict (id) do nothing;
insert into customer_profile (customer_id, facts) values
  ('cust_a', '{"name":"Linh","lactose_intolerant":true,"prefers":"oat milk lattes","last_order":"oat latte + almond croissant"}')
  on conflict (customer_id) do update set facts = excluded.facts, updated_at = now();
-- episodic + knowledge rows are inserted by a seed script (later task) because they need embeddings.
