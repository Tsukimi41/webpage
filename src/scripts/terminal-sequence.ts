export async function playTerminal(
	dialog: HTMLDialogElement,
	typo: boolean,
	pause: (ms: number) => Promise<boolean>,
): Promise<void> {
	const command = dialog.querySelector<HTMLElement>('[data-terminal-command]')!;
	const message = dialog.querySelector<HTMLElement>('[data-terminal-message]')!;
	const result = dialog.querySelector<HTMLElement>('[data-terminal-result]')!;
	const status = dialog.querySelector<HTMLElement>('[data-terminal-status]')!;
	const screen = dialog.querySelector<HTMLElement>('[data-terminal-screen]')!;
	const failure = dialog.querySelector<HTMLElement>('[data-terminal-failure]')!;
	const confirmation = dialog.querySelector<HTMLElement>('[data-terminal-confirmation]')!;
	const answer = dialog.querySelector<HTMLElement>('[data-terminal-answer]')!;
	const steps = [...dialog.querySelectorAll<HTMLElement>('[data-terminal-step]')];
	const followCursor = () => { screen.scrollTop = screen.scrollHeight; };
	const stage = (name: string, label: string) => {
		dialog.dataset.stage = name;
		status.textContent = label;
		followCursor();
	};
	const type = async (text: string) => {
		for (let index = 1; index <= text.length; index++) {
			const delay = text[index - 1] === ' ' ? 450 : [138, 180, 150, 220][(index - 1) % 4];
			if (!await pause(delay)) return false;
			command.textContent = text.slice(0, index);
		}
		return true;
	};
	stage('booting', 'セッションを準備しています');
	if (!await pause(2500)) return;
	stage('inspecting', 'Arch Linuxのセッション情報を表示しています');
	if (!await pause(2000)) return;
	stage('waiting', 'コマンド入力を待っています');
	if (!await pause(3500)) return;
	if (typo) {
		stage('typo', 'コマンドを入力しています');
		if (!await type('opne ./portfolio')) return;
		stage('typo-submitted', 'コマンドを実行します');
		if (!await pause(1200)) return;
		message.textContent = 'zsh: command not found: opne';
		failure.hidden = false;
		command.textContent = '';
		stage('error', 'おっと、打ち間違い。もう一度');
		if (!await pause(1500)) return;
		stage('recalling', 'コマンド履歴を呼び戻しています');
		// Recall the failed command into a new prompt, keeping shell history intact.
		command.textContent = 'opne ./portfolio';
		if (!await pause(650)) return;
		stage('correcting', 'コマンドを打ち直しています');
		while (command.textContent) {
			if (!await pause(60)) return;
			command.textContent = command.textContent.slice(0, -1);
		}
		stage('retry-waiting', '入力を整えて、もう一度');
		if (!await pause(1500)) return;
	}
	stage('typing', 'コマンドを入力しています');
	if (!await type('open ./portfolio')) return;
	stage('submitted', 'コマンドを実行します');
	if (!await pause(2000)) return;
	confirmation.hidden = false;
	stage('confirming', 'ターミナルで起動を確認しています');
	if (!await pause(2000)) return;
	answer.textContent = 'y';
	stage('confirmed', '起動を承認しました');
	if (!await pause(800)) return;
	stage('loading', 'ポートフォリオを開いています');
	// These are the entrance's presentation steps, not network progress estimates.
	for (const step of steps) {
		step.dataset.state = 'active';
		followCursor();
		if (!await pause(1800)) return;
		step.dataset.state = 'complete';
	}
	result.textContent = ':: Session ready. Opening portfolio.';
	stage('ready', '準備完了。ようこそ');
	if (!await pause(2200)) return;
	stage('done', 'サイトへ移動します');
	await pause(820);
}
