import { TERMINAL_CONFIG } from '../config/terminal.ts';
import { terminalWatchdogMs } from './terminal-timing.ts';

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
	const cadence = TERMINAL_CONFIG.typoEveryVisits;
	try {
		const key = 'portfolio:terminal-visits:v1';
		const stored = Number(localStorage.getItem(key));
		if (cadence > 0) {
			const visit = (Number.isSafeInteger(stored) && stored >= 0 ? stored % cadence : 0) + 1;
			typo = visit === cadence;
			localStorage.setItem(key, String(visit % cadence));
		}
	} catch { /* Storage can be blocked; the entrance must still work. */ }
	dialog.dataset.typo = String(typo);
	void import('./terminal-sequence')
		.then(({ playTerminal }) => {
			if (!session.begin(terminalWatchdogMs(typo))) return;
			return playTerminal(dialog, typo, session.pause);
		})
		.catch(() => undefined)
		.finally(session.finish);
}
