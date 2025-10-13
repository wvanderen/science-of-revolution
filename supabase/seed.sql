-- Seed data for testing Science of Revolution Web App
-- Run this after migrations to set up initial test data

-- Insert a test cohort
insert into public.cohorts (name, description, visibility, start_date)
values
  ('Fall 2025 Cohort', 'Fall 2025 study group for Science of Revolution', 'private', '2025-09-01'),
  ('Demo Cohort', 'Demo cohort for testing purposes', 'private', current_date)
on conflict (id) do nothing;

-- Get the cohort ID for the Fall 2025 cohort
do $$
declare
  fall_cohort_id uuid;
  demo_cohort_id uuid;
  manifesto_id uuid;
  capital_id uuid;
  state_rev_id uuid;
begin
  select id into fall_cohort_id from public.cohorts where name = 'Fall 2025 Cohort' limit 1;
  select id into demo_cohort_id from public.cohorts where name = 'Demo Cohort' limit 1;

  -- Insert test invite codes
  insert into public.invite_codes (code, type, max_uses, cohort_id, metadata)
  values
    ('FALL2025', 'member', 100, fall_cohort_id, '{"description": "General member invite for Fall 2025"}'::jsonb),
    ('FALL2025-FACILITATOR', 'facilitator', 10, fall_cohort_id, '{"description": "Facilitator invite for Fall 2025"}'::jsonb),
    ('DEMO123', 'member', null, demo_cohort_id, '{"description": "Unlimited demo code"}'::jsonb)
  on conflict (code) do nothing;

  -- Insert canonical resources
  select id into manifesto_id from public.resources where title = 'The Communist Manifesto' limit 1;
  if manifesto_id is null then
    insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
    values ('The Communist Manifesto', 'Karl Marx and Friedrich Engels', 'document', 'https://www.marxists.org/archive/marx/works/1848/communist-manifesto/', 'resources/communist-manifesto/index.html', 1)
    returning id into manifesto_id;
  else
    update public.resources
    set author = 'Karl Marx and Friedrich Engels',
        type = 'document',
        source_url = 'https://www.marxists.org/archive/marx/works/1848/communist-manifesto/',
        storage_path = 'resources/communist-manifesto/index.html',
        sequence_order = 1,
        updated_at = now()
    where id = manifesto_id;
  end if;

  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values
    (manifesto_id, 'Preface to the 1872 German Edition', 1, '<h3>Preface to the 1872 German Edition</h3><p>The Communist Manifesto has become a historical document which we no longer had any right to alter.</p><p>Nevertheless, as the basic principles retain their validity, we have decided to republish the present edition as the authoritative text.</p>', 72),
    (manifesto_id, 'I. Bourgeois and Proletarians', 2, '<h3>I. Bourgeois and Proletarians</h3><p>The history of all hitherto existing society is the history of class struggles.</p><p>Freeman and slave, patrician and plebeian, guild-master and journeyman, in a word, oppressor and oppressed, stood in constant opposition to one another.</p>', 84),
    (manifesto_id, 'II. Proletarians and Communists', 3, '<h3>II. Proletarians and Communists</h3><p>The Communists do not form a separate party opposed to the other working-class parties.</p><p>They have no interests separate and apart from those of the proletariat as a whole, but only express the general interests of the movement.</p>', 82),
    (manifesto_id, 'IV. Position of the Communists in Relation to the Various Existing Opposition Parties', 4, '<h3>IV. Position of the Communists in Relation to the Various Existing Opposition Parties</h3><p>The Communists fight for the attainment of the immediate aims, for the enforcement of the momentary interests of the working class.</p><p>But in the movement of the present, they also represent and take care of the future of the movement.</p>', 90)
  on conflict (resource_id, "order") do update
    set title = excluded.title,
        content_html = excluded.content_html,
        word_count = excluded.word_count,
        updated_at = now();

  select id into capital_id from public.resources where title = 'Capital, Volume I' limit 1;
  if capital_id is null then
    insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
    values ('Capital, Volume I', 'Karl Marx', 'document', 'https://www.marxists.org/archive/marx/works/1867-c1/', 'resources/capital-volume-1/index.html', 2)
    returning id into capital_id;
  else
    update public.resources
    set author = 'Karl Marx',
        type = 'document',
        source_url = 'https://www.marxists.org/archive/marx/works/1867-c1/',
        storage_path = 'resources/capital-volume-1/index.html',
        sequence_order = 2,
        updated_at = now()
    where id = capital_id;
  end if;

  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values
    (capital_id, 'Chapter I. Commodities', 1, '<h3>Chapter I. Commodities</h3><p>The wealth of societies in which the capitalist mode of production prevails appears as an immense collection of commodities.</p><p>Each individual commodity is in turn a unity of use-value and exchange-value, in which resides the secret of political economy.</p>', 86),
    (capital_id, 'Chapter IV. Transformation of Money into Capital', 2, '<h3>Chapter IV. Transformation of Money into Capital</h3><p>The circulation of commodities is the starting-point of capital.</p><p>The change of money into capital must be developed on the basis of the immanent laws of the exchange of commodities.</p>', 79),
    (capital_id, 'Chapter XXV. The General Law of Capitalist Accumulation', 3, '<h3>Chapter XXV. The General Law of Capitalist Accumulation</h3><p>Capitalist production develops technology and the combining together of various processes into a social whole.</p><p>With accumulation of capital, the relative magnitude of the industrial reserve army expands, determining the workers'' condition.</p>', 88)
  on conflict (resource_id, "order") do update
    set title = excluded.title,
        content_html = excluded.content_html,
        word_count = excluded.word_count,
        updated_at = now();

  select id into state_rev_id from public.resources where title = 'The State and Revolution' limit 1;
  if state_rev_id is null then
    insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
    values ('The State and Revolution', 'Vladimir Lenin', 'document', 'https://www.marxists.org/archive/lenin/works/1917/staterev/', 'resources/state-and-revolution/index.html', 3)
    returning id into state_rev_id;
  else
    update public.resources
    set author = 'Vladimir Lenin',
        type = 'document',
        source_url = 'https://www.marxists.org/archive/lenin/works/1917/staterev/',
        storage_path = 'resources/state-and-revolution/index.html',
        sequence_order = 3,
        updated_at = now()
    where id = state_rev_id;
  end if;

  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values
    (state_rev_id, 'Chapter I. Class Society and the State', 1, '<h3>Chapter I. Class Society and the State</h3><p>The state is the product and the manifestation of the irreconcilability of class antagonisms.</p><p>Special bodies of armed men, prisons, and coercive institutions arise wherever society is split into classes.</p>', 83),
    (state_rev_id, 'Chapter III. The Experience of 1917', 2, '<h3>Chapter III. The Experience of 1917</h3><p>The Soviets represent the direct organization of the working and exploited masses.</p><p>The revolution of 1917 showed that only by breaking the old state machine could power pass to the proletariat.</p>', 82),
    (state_rev_id, 'Chapter VII. The Transition from Capitalism to Communism', 3, '<h3>Chapter VII. The Transition from Capitalism to Communism</h3><p>Communism is the abolition of the state, but only after a period of transition in which the proletariat holds political power.</p><p>As social habits change and classes disappear, the need for coercive authority withers away.</p>', 78)
  on conflict (resource_id, "order") do update
    set title = excluded.title,
        content_html = excluded.content_html,
        word_count = excluded.word_count,
        updated_at = now();
end $$;

-- Log success
do $$
begin
  raise notice 'Seed data inserted successfully';
  raise notice 'Test invite codes: FALL2025 (member), FALL2025-FACILITATOR (facilitator), DEMO123 (demo)';
end $$;
