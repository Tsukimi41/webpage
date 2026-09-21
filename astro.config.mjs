// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import publicationGuard from './src/integrations/publication-guard.mjs';

export default defineConfig({
	integrations: [icon(), publicationGuard()],
});
