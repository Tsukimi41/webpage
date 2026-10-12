import { TERMINAL_CONFIG, type TerminalConfig } from '../config/terminal.ts';

const MAX_TIMER_MS = 2_147_483_647;
type Timing = TerminalConfig['timing'];

function validateDurations(value: unknown, path: string): void {
	if (typeof value === 'number') {
		if (!Number.isFinite(value) || value < 0 || value > MAX_TIMER_MS) {
			throw new Error(`${path}: 時間は0以上の有限値で指定してください（最大${MAX_TIMER_MS}ms）`);
		}
	} else if (value && typeof value === 'object') {
		for (const [key, item] of Object.entries(value)) validateDurations(item, `${path}.${key}`);
	}
}

// timing内の数値はすべてms。表示文言を保ち、JSとCSSの時間を同じ倍率で変換する。
function scaleDurations<T>(value: T, scale: number): T {
	if (typeof value === 'number') return Math.round(value * scale) as T;
	if (Array.isArray(value)) return value.map(item => scaleDurations(item, scale)) as T;
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scaleDurations(item, scale)])) as T;
	}
	return value;
}

export function createTerminalTiming(config: TerminalConfig = TERMINAL_CONFIG): Timing {
	if (!Number.isFinite(config.durationScale) || config.durationScale <= 0) throw new Error('durationScale: 0より大きい有限値を指定してください');
	if (!Number.isSafeInteger(config.typoEveryVisits) || config.typoEveryVisits < 0) throw new Error('typoEveryVisits: 0以上の整数を指定してください');
	if (!config.timing.characterDelaysMs.length) throw new Error('characterDelaysMs: 入力間隔を1つ以上指定してください');
	if (!config.timing.loadingSteps.length) throw new Error('loadingSteps: 起動ログを1行以上指定してください');
	validateDurations(config.timing, 'timing');
	validateDurations(config.safety, 'safety');
	if (config.safety.downloadTimeoutMs === 0 || config.safety.presentationSlackMs === 0) throw new Error('safety: 解除タイマーの時間は0より大きくしてください');
	const timing = scaleDurations(config.timing, config.durationScale);
	validateDurations(timing, 'scaledTiming');
	return timing;
}

export function characterDelayMs(character: string, index: number, timing: Timing): number {
	return character === ' ' ? timing.spaceDelayMs : timing.characterDelaysMs[index % timing.characterDelaysMs.length];
}

export function typingDurationMs(text: string, timing: Timing): number {
	return Array.from(text).reduce((sum, character, index) => sum + characterDelayMs(character, index, timing), 0);
}

export function terminalDurationMs(typo: boolean, config: TerminalConfig = TERMINAL_CONFIG): number {
	const t = createTerminalTiming(config);
	const normal = t.blankPromptMs + t.systemInfoMs + t.beforeTypingMs + typingDurationMs(config.command, t)
		+ t.beforeExecuteMs + t.confirmationWaitMs + t.confirmationAnswerMs
		+ t.loadingSteps.reduce((sum, step) => sum + step.durationMs, 0) + t.readyMs
		+ t.motion.exitFadeMs + t.motion.exitBufferMs;
	const correction = typo ? typingDurationMs(config.mistypedCommand, t) + t.typo.beforeErrorMs + t.typo.errorMs
		+ t.typo.recallMs + Array.from(config.mistypedCommand).length * t.typo.eraseCharacterMs + t.typo.beforeRetryMs : 0;
	const total = normal + correction;
	validateDurations(total + config.safety.presentationSlackMs, 'presentationTimeout');
	return total;
}

export function terminalWatchdogMs(typo: boolean, config: TerminalConfig = TERMINAL_CONFIG): number {
	return terminalDurationMs(typo, config) + config.safety.presentationSlackMs;
}
