-- Kolom voor het Google place_id per restaurant (stap 1 van de Google-score).
-- Veilig: voegt alleen een lege kolom toe, verandert of verwijdert niets.
-- Volgens de voorwaarden van Google mag alleen dit id bewaard worden; de
-- score zelf haalt de website steeds live op en slaat hem nergens op.
alter table public.restaurants
  add column if not exists google_place_id text;

-- Elk place_id hoort bij hooguit één restaurant (lege waarden mogen vaker).
create unique index if not exists restaurants_google_place_id_key
  on public.restaurants (google_place_id)
  where google_place_id is not null;

-- Controle: moet 1 rij geven.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'restaurants' and column_name = 'google_place_id';
