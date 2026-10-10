export async function playTerminal(
	dialog: HTMLDialogElement,
	typo: boolean,
	pause: (ms: number) => Promise<boolean>,
): Promise<void> {
	const command = dialog.querySelector<HTMLElement>('[data-terminal-command]')!;
	const message = dialog.querySelector<HTMLElement>('[data-terminal-message]')!;
	const result = dialog.querySelector<HTMLElement>('[data-terminal-result]')!;
	const type = async (text: string) => {
		for (let index = 1; index <= text.length; index++) {
			if (!await pause(26)) return false;
			command.textContent = text.slice(0, index);
		}
		return true;
	};
	if (!await pause(180)) return;
	if (typo) {
		dialog.dataset.stage = 'typo';
		if (!await type('opne ./portfolio')) return;
		message.textContent = 'zsh: command not found: opne';
		if (!await pause(220)) return;
		dialog.dataset.stage = 'correcting';
		while (command.textContent) {
			if (!await pause(12)) return;
			command.textContent = command.textContent.slice(0, -1);
		}
		message.textContent = '↳ もう一度。';
	}
	dialog.dataset.stage = 'typing';
	if (!await type('open ./portfolio')) return;
	if (!await pause(120)) return;
	message.textContent = '';
	result.textContent = '✓ Welcome. Opening your next discovery.';
	dialog.dataset.stage = 'ready';
	if (!await pause(200)) return;
	dialog.dataset.stage = 'done';
	await pause(140);
}
