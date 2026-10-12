import { TERMINAL_CONFIG } from '../src/config/terminal.ts';
import { createTerminalTiming, terminalDurationMs, terminalWatchdogMs, typingDurationMs } from '../src/scripts/terminal-timing.ts';

const timing = createTerminalTiming();
const stages = {
	'空のプロンプト': timing.blankPromptMs,
	'Arch情報': timing.systemInfoMs,
	'入力前': timing.beforeTypingMs,
	'コマンド入力': typingDurationMs(TERMINAL_CONFIG.command, timing),
	'実行前': timing.beforeExecuteMs,
	'確認への返答前': timing.confirmationWaitMs,
	'返答表示': timing.confirmationAnswerMs,
	...Object.fromEntries(timing.loadingSteps.map((step, index) => [`ログ${index + 1}: ${step.label}`, step.durationMs])),
	'完了表示': timing.readyMs,
	'フェード＋退出余裕': timing.motion.exitFadeMs + timing.motion.exitBufferMs,
	'通常の総時間': terminalDurationMs(false),
	'打ち直し時の総時間': terminalDurationMs(true),
	'演出停滞時の解除（通常）': terminalWatchdogMs(false),
	'演出停滞時の解除（打ち直し）': terminalWatchdogMs(true),
};
console.log('設定: src/config/terminal.ts（時間は演出JS取得後の目安）');
console.log(`全体の時間倍率: ${TERMINAL_CONFIG.durationScale} / 打ち間違い: ${TERMINAL_CONFIG.typoEveryVisits === 0 ? '無効' : `${TERMINAL_CONFIG.typoEveryVisits}回に1回`}`);
console.table(Object.entries(stages).map(([項目, ms]) => ({ 項目, ms, 秒: ms / 1000 })));
