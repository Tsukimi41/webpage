let physics: Promise<typeof import('./skill-physics')> | undefined;
const loadPhysics = () => physics ??= import('./skill-physics').catch(error => {
	physics = undefined;
	throw error;
});

document.querySelectorAll<HTMLElement>('[data-skill-field]').forEach(field => {
	const details = field.closest('details');
	const note = details?.querySelector<HTMLElement>('[data-skill-load-note]');
	if (!details || !note) return;
	let revision = 0;
	let dispose: (() => void) | undefined;
	const stop = () => {
		revision++;
		dispose?.();
		dispose = undefined;
		field.removeAttribute('aria-busy');
		delete field.dataset.loadState;
		note.hidden = true;
	};
	const synchronize = async () => {
		stop();
		if (!details.open) return;
		const request = revision;
		field.dataset.loadState = 'loading';
		field.setAttribute('aria-busy', 'true');
		note.textContent = 'インタラクティブ表示を読み込んでいます…';
		note.hidden = false;
		try {
			const { startSkillPhysics } = await loadPhysics();
			if (request !== revision || !details.open || !field.isConnected) return;
			dispose = startSkillPhysics(field);
			field.dataset.loadState = 'ready';
			note.hidden = true;
		} catch {
			if (request !== revision) return;
			field.dataset.loadState = 'error';
			note.textContent = '読み込めませんでした。ページを再読み込みすると再試行できます。技術一覧は上に表示しています。';
		} finally {
			if (request === revision) field.removeAttribute('aria-busy');
		}
	};
	details.addEventListener('toggle', synchronize);
	window.addEventListener('pagehide', stop);
	window.addEventListener('pageshow', synchronize);
	document.addEventListener('astro:before-swap', stop, { once: true });
	if (details.open) void synchronize();
});
