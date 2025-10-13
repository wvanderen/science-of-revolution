-- Seed data for Science of Revolution reading resources
-- Run this after migrations and basic seed.sql
-- Contains sample Marxist texts split into sections

-- Clean up existing resources if re-running
delete from public.resource_sections;
delete from public.resources;

-- ============================================================================
-- Resource 1: Manifesto of the Communist Party (Abridged)
-- ============================================================================
do $$
declare
  resource_id uuid;
  section_id uuid;
begin
  -- Create resource
  insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
  values (
    'Manifesto of the Communist Party',
    'Karl Marx and Friedrich Engels',
    'document',
    'https://www.marxists.org/archive/marx/works/1848/communist-manifesto/',
    '/resources/communist-manifesto.html',
    1
  )
  returning id into resource_id;

  -- Section 1: Bourgeois and Proletarians
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'I. Bourgeois and Proletarians',
    0,
    '<p>The history of all hitherto existing society is the history of class struggles.</p>

<p>Freeman and slave, patrician and plebeian, lord and serf, guild-master and journeyman, in a word, oppressor and oppressed, stood in constant opposition to one another, carried on an uninterrupted, now hidden, now open fight, a fight that each time ended, either in a revolutionary reconstitution of society at large, or in the common ruin of the contending classes.</p>

<p>In the earlier epochs of history, we find almost everywhere a complicated arrangement of society into various orders, a manifold gradation of social rank. In ancient Rome we have patricians, knights, plebeians, slaves; in the Middle Ages, feudal lords, vassals, guild-masters, journeymen, apprentices, serfs; in almost all of these classes, again, subordinate gradations.</p>

<p>The modern bourgeois society that has sprouted from the ruins of feudal society has not done away with class antagonisms. It has but established new classes, new conditions of oppression, new forms of struggle in place of the old ones.</p>

<p>Our epoch, the epoch of the bourgeoisie, possesses, however, this distinct feature: it has simplified class antagonisms. Society as a whole is more and more splitting up into two great hostile camps, into two great classes directly facing each other — Bourgeoisie and Proletariat.</p>

<p><strong>The bourgeoisie, historically, has played a most revolutionary part.</strong></p>

<p>The bourgeoisie, wherever it has got the upper hand, has put an end to all feudal, patriarchal, idyllic relations. It has pitilessly torn asunder the motley feudal ties that bound man to his "natural superiors", and has left remaining no other nexus between man and man than naked self-interest, than callous "cash payment".</p>

<p>The bourgeoisie cannot exist without constantly revolutionising the instruments of production, and thereby the relations of production, and with them the whole relations of society. Conservation of the old modes of production in unaltered form, was, on the contrary, the first condition of existence for all earlier industrial classes.</p>

<p><strong>But not only has the bourgeoisie forged the weapons that bring death to itself; it has also called into existence the men who are to wield those weapons — the modern working class — the proletarians.</strong></p>',
    650
  );

  -- Section 2: Proletarians and Communists
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'II. Proletarians and Communists',
    1,
    '<p>In what relation do the Communists stand to the proletarians as a whole?</p>

<p>The Communists do not form a separate party opposed to the other working-class parties.</p>

<p>They have no interests separate and apart from those of the proletariat as a whole. They do not set up any sectarian principles of their own, by which to shape and mould the proletarian movement.</p>

<p>The Communists are distinguished from the other working-class parties by this only: 1. In the national struggles of the proletarians of the different countries, they point out and bring to the front the common interests of the entire proletariat, independently of all nationality. 2. In the various stages of development which the struggle of the working class against the bourgeoisie has to pass through, they always and everywhere represent the interests of the movement as a whole.</p>

<p><strong>The theoretical conclusions of the Communists are in no way based on ideas or principles that have been invented, or discovered, by this or that would-be universal reformer. They merely express, in general terms, actual relations springing from an existing class struggle, from a historical movement going on under our very eyes.</strong></p>

<p>The abolition of existing property relations is not at all a distinctive feature of communism. All property relations in the past have continually been subject to historical change consequent upon the change in historical conditions.</p>

<p>The Communist revolution is the most radical rupture with traditional property relations; no wonder that its development involved the most radical rupture with traditional ideas.</p>

<p>The proletariat will use its political supremacy to wrest, by degree, all capital from the bourgeoisie, to centralise all instruments of production in the hands of the State, i.e., of the proletariat organised as the ruling class; and to increase the total productive forces as rapidly as possible.</p>',
    530
  );

  -- Section 3: Position of the Communists
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'IV. Position of the Communists in Relation to the Various Existing Opposition Parties',
    2,
    '<p>The Communists fight for the attainment of the immediate aims, for the enforcement of the momentary interests of the working class; but in the movement of the present, they also represent and take care of the future of that movement.</p>

<p>The Communists everywhere support every revolutionary movement against the existing social and political order of things.</p>

<p>In all these movements, they bring to the front, as the leading question in each, the property question, no matter what its degree of development at the time.</p>

<p>Finally, they labour everywhere for the union and agreement of the democratic parties of all countries.</p>

<p><strong>The Communists disdain to conceal their views and aims. They openly declare that their ends can be attained only by the forcible overthrow of all existing social conditions. Let the ruling classes tremble at a Communistic revolution. The proletarians have nothing to lose but their chains. They have a world to win.</strong></p>

<p class="text-center font-bold text-xl">WORKING MEN OF ALL COUNTRIES, UNITE!</p>',
    280
  );

  raise notice 'Inserted Communist Manifesto with % sections', 3;
end $$;

-- ============================================================================
-- Resource 2: Wage Labour and Capital (Excerpt)
-- ============================================================================
do $$
declare
  resource_id uuid;
begin
  insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
  values (
    'Wage Labour and Capital',
    'Karl Marx',
    'document',
    'https://www.marxists.org/archive/marx/works/1847/wage-labour/',
    '/resources/wage-labour-capital.html',
    2
  )
  returning id into resource_id;

  -- Section 1: What are Wages?
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'What are Wages? How are they Determined?',
    0,
    '<p>Wages are the share of commodities with which the capitalist buys a certain amount of productive labour-power.</p>

<p>Labour-power is, therefore, a commodity which its possessor, the wage-worker, sells to the capitalist. Why does he sell it? In order to live.</p>

<p>But the exercise of labour-power, labour, is the worker''s own life-activity, the manifestation of his own life. And this life-activity he sells to another person in order to secure the necessary means of subsistence. Thus his life-activity is for him only a means to enable him to exist. He works in order to live. He does not even reckon labour as part of his life, it is rather a sacrifice of his life. It is a commodity which he has made over to another.</p>

<p><strong>The worker therefore only feels himself outside his work, and in his work feels outside himself. He is at home when he is not working, and when he is working he is not at home.</strong></p>

<p>What is the price of a commodity? It is determined by the competition between buyers and sellers, by the relation between supply and demand. The competition by which the price of a commodity is determined is three-sided.</p>

<p>The same commodity is offered by various sellers. Whoever sells commodities of the same quality at the cheapest price, is sure of driving the other sellers from the field. Thus the sellers compete among themselves for sales, for the market.</p>

<p>On the other hand, the buyers compete among themselves by attempting to buy specific commodities for as little money as possible. Finally, the buyers compete with the sellers, wishing to buy as cheaply as possible, while the sellers wish to sell as dearly as possible.</p>',
    430
  );

  -- Section 2: What is Capital?
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'By What is the Price of a Commodity Determined?',
    1,
    '<p>By competition between buyers and sellers, by the relation of supply to demand. The competition by which the price of a commodity is determined is three-sided.</p>

<p>A commodity may fall below its cost of production without thereby ceasing to be sold. For not its sale, but the amount of its daily, weekly, yearly sale, must cover the total cost. A commodity sold below its cost of production in one instance may above it in another, thus providing the capitalist with compensation.</p>

<p>And even selling constantly below the cost of production is a circumstance that may often be met with. This occurs, for instance, when a machine is introduced which makes it possible to produce the same quantity of goods at less cost. The old producers who cannot introduce the new machine must sell below the cost of production if they wish to sell at all.</p>

<p><strong>The introduction of machinery has abolished the handicraft system of industry, has broken up manufacture into factory-work, has concentrated and centralised capital, has set the labourer in competition with the machine, and, by lowering the cost of production, has compelled the workers to work longer and harder.</strong></p>

<p>The constant improvement of machinery, the ever more rapid increase in the productivity of labour, has the effect of depreciating labour-power constantly and increasingly.</p>',
    350
  );

  raise notice 'Inserted Wage Labour and Capital with % sections', 2;
end $$;

-- ============================================================================
-- Resource 3: Principles of Communism (Excerpt)
-- ============================================================================
do $$
declare
  resource_id uuid;
begin
  insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
  values (
    'Principles of Communism',
    'Friedrich Engels',
    'document',
    'https://www.marxists.org/archive/marx/works/1847/11/prin-com.htm',
    '/resources/principles-of-communism.html',
    3
  )
  returning id into resource_id;

  -- Section 1: What is Communism?
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'Question 1: What is Communism?',
    0,
    '<p><strong>Answer:</strong> Communism is the doctrine of the conditions of the liberation of the proletariat.</p>

<p><strong>Question 2: What is the proletariat?</strong></p>

<p><strong>Answer:</strong> The proletariat is that class in society which lives entirely from the sale of its labor and does not draw profit from any kind of capital; whose weal and woe, whose life and death, whose sole existence depends on the demand for labor – hence, on the changing state of business, on the vagaries of unbridled competition.</p>

<p>The proletariat, or the class of proletarians, is, in a word, the working class of the 19th century.</p>',
    180
  );

  -- Section 2: Proletarians and Big Industry
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values (
    resource_id,
    'Question 6: How did the proletariat originate?',
    1,
    '<p><strong>Answer:</strong> The proletariat originated in the industrial revolution, which took place in England in the last half of the last (18th) century, and which has since then been repeated in all the civilized countries of the world.</p>

<p>This industrial revolution was precipitated by the discovery of the steam engine, various spinning machines, the mechanical loom, and a whole series of other mechanical devices. These machines, which were very expensive and hence could be bought only by big capitalists, altered the whole mode of production and displaced the former workers, because the machines turned out cheaper and better commodities than the workers could produce with their inefficient spinning wheels and handlooms.</p>

<p><strong>The machines delivered industry wholly into the hands of the big capitalists and rendered entirely worthless the meagre property of the workers (tools, looms, etc.). The result was that the capitalists soon had everything in their hands and nothing remained to the workers.</strong></p>

<p>This marked the introduction of the factory system into the textile industry.</p>

<p>Once the impulse to the introduction of machinery and the factory system had been given, this system spread quickly to all other branches of industry, especially cloth- and book-printing, pottery, and the metal industries.</p>',
    320
  );

  raise notice 'Inserted Principles of Communism with % sections', 2;
end $$;

-- Log completion
do $$
declare
  resource_count integer;
  section_count integer;
begin
  select count(*) into resource_count from public.resources;
  select count(*) into section_count from public.resource_sections;

  raise notice '========================================';
  raise notice 'Resource seeding complete!';
  raise notice 'Total resources: %', resource_count;
  raise notice 'Total sections: %', section_count;
  raise notice '========================================';
  raise notice 'Navigate to /library to see the resources';
  raise notice 'Use invite code FALL2025 or DEMO123 to sign up';
end $$;
