
-- Function to handle XP gain and Level Up
create or replace function handle_xp_gain()
returns trigger as $$
declare
  new_level int;
begin
  -- Check new level based on total_xp
  select level into new_level
  from public.levels
  where min_xp <= new.total_xp
  order by level desc
  limit 1;

  if new_level > new.current_level then
    new.current_level := new_level;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger on_xp_change
before update of total_xp on public.profiles
for each row
execute function handle_xp_gain();
