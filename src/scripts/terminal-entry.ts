const dialog = document.querySelector<HTMLDialogElement>('[data-terminal-entry]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

if (dialog && !reducedMotion.matches && !location.hash && navigation?.type !== 'back_forward') {
	let typo = false;
	try {
		const key = 'portfolio:terminal-visits:v1';
		const stored = Number(localStorage.getItem(key));
		const visit = (Number.isSafeInteger(stored) && stored >= 0 ? stored % 3 : 0) + 1;
		typo = visit === 3;
		localStorage.setItem(key, String(visit % 3));
	} catch { /* Storage can be blocked; the entrance must still work. */ }
	const events = new AbortController();
	let stopped = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let resolvePause: ((value: boolean) => void) | undefined;
	const finish = (keyboard = false) => {
		if (stopped) return;
		stopped = true;
		clearTimeout(timer);
		clearTimeout(watchdog);
		resolvePause?.(false);
		events.abort();
		dialog.close();
		const destination = document.querySelector<HTMLElement>(keyboard ? '.skip-link' : '#main-content');
		destination?.focus({ preventScroll: true });
	};
	const watchdog = setTimeout(() => finish(), 4000);
	const pause = (ms: number) => new Promise<boolean>(resolve => {
		if (stopped) { resolve(false); return; }
		resolvePause = resolve;
		timer = setTimeout(() => { resolvePause = undefined; resolve(true); }, ms);
	});
	dialog.showModal();
	dialog.dataset.typo = String(typo);
	dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); }, { signal: events.signal });
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' || event.key === 'Tab') {
			event.preventDefault();
			finish(event.key === 'Tab');
		}
	}, { capture: true, signal: events.signal });
	dialog.querySelector('[data-terminal-skip]')?.addEventListener('click', () => finish(), { signal: events.signal });
	reducedMotion.addEventListener('change', () => finish(), { signal: events.signal });
	window.addEventListener('pagehide', () => finish(), { signal: events.signal });
	void import('./terminal-sequence')
		.then(({ playTerminal }) => stopped ? undefined : playTerminal(dialog, typo, pause))
		.catch(() => undefined)
		.finally(() => finish());
}
