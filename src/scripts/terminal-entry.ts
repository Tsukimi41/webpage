type TerminalSession = {
	readonly active: boolean;
	finish: () => void;
	begin: (timeoutMs: number) => boolean;
	pause: (ms: number) => Promise<boolean>;
};
const dialog = document.querySelector<HTMLDialogElement & { terminalSession?: TerminalSession }>('[data-terminal-entry]');
const session = dialog?.terminalSession;

if (dialog && session?.active) {
	let typo = false;
	try {
		const key = 'portfolio:terminal-visits:v1';
		const stored = Number(localStorage.getItem(key));
		const visit = (Number.isSafeInteger(stored) && stored >= 0 ? stored % 3 : 0) + 1;
		typo = visit === 3;
		localStorage.setItem(key, String(visit % 3));
	} catch { /* Storage can be blocked; the entrance must still work. */ }
	dialog.dataset.typo = String(typo);
	void import('./terminal-sequence')
		.then(({ playTerminal }) => {
			if (!session.begin(45000)) return;
			return playTerminal(dialog, typo, session.pause);
		})
		.catch(() => undefined)
		.finally(session.finish);
}
