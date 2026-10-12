// HTMLにインライン展開するため、importや外部変数に依存させない。
// 本文を解析する前に開き、外部JSの読み込みが止まっても閉じられるようにする。
(() => {
	const dialog = document.querySelector('[data-terminal-entry]');
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	const navigation = performance.getEntriesByType('navigation')[0];
	if (!dialog || reducedMotion.matches || location.hash || navigation?.type === 'back_forward') return;
	const events = new AbortController();
	let stopped = false;
	let timer;
	let resolvePause;
	let watchdog;
	const finish = () => {
		if (stopped) return;
		stopped = true;
		clearTimeout(timer);
		clearTimeout(watchdog);
		resolvePause?.(false);
		events.abort();
		dialog.close();
		document.querySelector('#main-content')?.focus({ preventScroll: true });
	};
	dialog.terminalSession = {
		get active() { return !stopped; },
		finish,
		begin(timeoutMs) {
			if (stopped) return false;
			clearTimeout(watchdog);
			watchdog = setTimeout(finish, timeoutMs);
			return true;
		},
		pause(ms) {
			return new Promise(resolve => {
				if (stopped) { resolve(false); return; }
				resolvePause = resolve;
				timer = setTimeout(() => { resolvePause = undefined; resolve(true); }, ms);
			});
		},
	};
	dialog.showModal();
	watchdog = setTimeout(finish, Number(document.currentScript.dataset.downloadTimeoutMs));
	dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); }, { signal: events.signal });
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') { event.preventDefault(); finish(); }
	}, { capture: true, signal: events.signal });
	reducedMotion.addEventListener('change', finish, { signal: events.signal });
	window.addEventListener('pagehide', finish, { signal: events.signal });
})();
