begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 6: hybrid search is ready.

select is(
  (select extnamespace::regnamespace::text from pg_extension where extname = 'vector'),
  'extensions',
  'pgvector lives in the extensions schema'
);

select is(
  (select format_type(atttypid, atttypmod) from pg_attribute
   where attrelid = 'public.kb_chunks'::regclass and attname = 'embedding'),
  'vector(1024)',
  'embedding is vector(1024)'
);

select ok(
  (select indexdef ~ 'USING hnsw \(embedding (extensions\.)?vector_cosine_ops\)' from pg_indexes
   where schemaname = 'public' and indexname = 'kb_chunks_embedding_idx'),
  'the embedding has an HNSW cosine index'
);

select ok(
  (select indexdef ~ 'USING gin \(fts\)' from pg_indexes
   where schemaname = 'public' and indexname = 'kb_chunks_fts_idx'),
  'fts has a GIN index'
);

select is(
  (select is_generated from information_schema.columns
   where table_schema = 'public' and table_name = 'kb_chunks' and column_name = 'fts'),
  'ALWAYS',
  'fts is a generated column'
);

insert into public.kb_chunks (source_type, source_ref, chunk_index, content, content_hash, embedding)
values
  ('stop', 'hbk', 0, 'Aiana answers questions with citations', 'a', (select array_agg(case when i = 1 then 1.0::real else 0.0::real end) from generate_series(1, 1024) i)::extensions.vector),
  ('stop', 'optty', 0, 'Payment provider integrations', 'b', (select array_agg(case when i = 2 then 1.0::real else 0.0::real end) from generate_series(1, 1024) i)::extensions.vector);

select is(
  (select source_ref from public.kb_chunks where fts @@ websearch_to_tsquery('english', 'citation')),
  'hbk',
  'full text search finds a stemmed word'
);

select is(
  (select source_ref from public.kb_chunks
   order by embedding <=> (select array_agg(case when i = 1 then 1.0::real else 0.0::real end) from generate_series(1, 1024) i)::extensions.vector limit 1),
  'hbk',
  'cosine search returns the nearest chunk'
);

select throws_ok(
  $$insert into public.kb_chunks (source_type, source_ref, chunk_index, content, content_hash, embedding)
    values ('stop', 'hbk', 0, 'dup', 'c', array_fill(0.3::real, array[1024])::extensions.vector)$$,
  '23505', null, 'a chunk position is unique per source');

select * from finish();
rollback;
