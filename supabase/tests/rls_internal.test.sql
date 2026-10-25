begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Acceptance criterion 4: kb_chunks and assistant_evals are server only.

insert into public.kb_chunks (source_type, source_ref, chunk_index, content, content_hash, embedding)
  values ('stop', 'hbk', 0, 'Internal chunk', 'h', array_fill(0.1::real, array[1024])::extensions.vector);
insert into public.assistant_evals (question) values ('Internal question');

set local role anon;
select throws_ok('select * from public.kb_chunks', '42501', null, 'anon cannot read kb_chunks');
select throws_ok('select * from public.assistant_evals', '42501', null, 'anon cannot read assistant_evals');

set local role authenticated;
select throws_ok('select * from public.kb_chunks', '42501', null, 'authenticated cannot read kb_chunks');
select throws_ok('select * from public.assistant_evals', '42501', null, 'authenticated cannot read assistant_evals');

set local role service_role;
select is((select count(*) from public.kb_chunks), 1::bigint, 'the secret key role reads kb_chunks');
select is((select count(*) from public.assistant_evals), 1::bigint, 'the secret key role reads assistant_evals');

reset role;
select * from finish();
rollback;
