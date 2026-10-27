import { createSupabaseDeps } from '../_shared/deps.ts';
import { createHandler } from './handler.ts';

Deno.serve(createHandler(createSupabaseDeps()));
