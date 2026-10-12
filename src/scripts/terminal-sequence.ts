import { TERMINAL_CONFIG, type TerminalConfig } from '../config/terminal.ts';
import { characterDelayMs, createTerminalTiming } from './terminal-timing.ts';

export async function playTerminal(
	dialog: HTMLDialogElement,
	typo: boolean,
	pause: (ms: number) => Promise<boolean>,
	config: TerminalConfig = TERMINAL_CONFIG,
): Promise<void> {
	const timing = createTerminalTiming(config);
	const command = dialog.querySelector<HTMLElement>('[data-terminal-command]')!;
	const message = dialog.querySelector<HTMLElement>('[data-terminal-message]')!;
	const result = dialog.querySelector<HTMLElement>('[data-terminal-result]')!;
	const status = dialog.querySelector<HTMLElement>('[data-terminal-status]')!;
	const screen = dialog.querySelector<HTMLElement>('[data-terminal-screen]')!;
	const failure = dialog.querySelector<HTMLElement>('[data-terminal-failure]')!;
	const confirmation = dialog.querySelector<HTMLElement>('[data-terminal-confirmation]')!;
	const answer = dialog.querySelector<HTMLElement>('[data-terminal-answer]')!;
	const steps = [...dialog.querySelectorAll<HTMLElement>('[data-terminal-step]')];
	if (steps.length !== timing.loadingSteps.length) throw new Error('起動ログの行数が設定と一致しません');
	const followCursor = () => { screen.scrollTop = screen.scrollHeight; };
	const stage = (name: string, label: string) => {
		dialog.dataset.stage = name;
		status.textContent = label;
		followCursor();
	};
	const type = async (text: string) => {
		const characters = Array.from(text);
		for (let index = 0; index < characters.length; index++) {
			const delay = characterDelayMs(characters[index], index, timing);
			if (!await pause(delay)) return false;
			command.textContent = characters.slice(0, index + 1).join('');
		}
		return true;
	};
	stage('booting', 'セッションを準備しています');
	if (!await pause(timing.blankPromptMs)) return;
	stage('inspecting', 'Arch Linuxのセッション情報を表示しています');
	if (!await pause(timing.systemInfoMs)) return;
	stage('waiting', 'コマンド入力を待っています');
	if (!await pause(timing.beforeTypingMs)) return;
	if (typo) {
		stage('typo', 'コマンドを入力しています');
		if (!await type(config.mistypedCommand)) return;
		stage('typo-submitted', 'コマンドを実行します');
		if (!await pause(timing.typo.beforeErrorMs)) return;
		message.textContent = config.errorMessage;
		failure.hidden = false;
		command.textContent = '';
		stage('error', 'おっと、打ち間違い。もう一度');
		if (!await pause(timing.typo.errorMs)) return;
		stage('recalling', 'コマンド履歴を呼び戻しています');
		// Recall the failed command into a new prompt, keeping shell history intact.
		command.textContent = config.mistypedCommand;
		if (!await pause(timing.typo.recallMs)) return;
		stage('correcting', 'コマンドを打ち直しています');
		while (command.textContent) {
			if (!await pause(timing.typo.eraseCharacterMs)) return;
			command.textContent = Array.from(command.textContent).slice(0, -1).join('');
		}
		stage('retry-waiting', '入力を整えて、もう一度');
		if (!await pause(timing.typo.beforeRetryMs)) return;
	}
	stage('typing', 'コマンドを入力しています');
	if (!await type(config.command)) return;
	stage('submitted', 'コマンドを実行します');
	if (!await pause(timing.beforeExecuteMs)) return;
	confirmation.hidden = false;
	stage('confirming', 'ターミナルで起動を確認しています');
	if (!await pause(timing.confirmationWaitMs)) return;
	answer.textContent = config.confirmationAnswer;
	stage('confirmed', '起動を承認しました');
	if (!await pause(timing.confirmationAnswerMs)) return;
	stage('loading', 'ポートフォリオを開いています');
	// These are the entrance's presentation steps, not network progress estimates.
	for (const [index, step] of steps.entries()) {
		step.dataset.state = 'active';
		followCursor();
		if (!await pause(timing.loadingSteps[index].durationMs)) return;
		step.dataset.state = 'complete';
	}
	result.textContent = config.readyMessage;
	stage('ready', '準備完了。ようこそ');
	if (!await pause(timing.readyMs)) return;
	stage('done', 'サイトへ移動します');
	await pause(timing.motion.exitFadeMs + timing.motion.exitBufferMs);
}
