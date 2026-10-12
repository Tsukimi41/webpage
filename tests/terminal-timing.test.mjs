import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMINAL_CONFIG } from '../src/config/terminal.ts';
import { createTerminalTiming, terminalDurationMs, terminalWatchdogMs } from '../src/scripts/terminal-timing.ts';
import { playTerminal } from '../src/scripts/terminal-sequence.ts';

function createDialog(config) {
	const nodes = new Map(['command', 'message', 'result', 'status', 'screen', 'failure', 'confirmation', 'answer'].map(key => [
		`[data-terminal-${key}]`, { textContent: '', hidden: true, scrollHeight: 100, scrollTop: 0 },
	]));
	const steps = config.timing.loadingSteps.map(() => ({ dataset: {} }));
	return { dataset: {}, querySelector: selector => nodes.get(selector), querySelectorAll: () => steps };
}

for (const typo of [false, true]) {
	test(`estimated time matches the real sequence after timing, command and log edits (typo=${typo})`, async () => {
		const config = structuredClone(TERMINAL_CONFIG);
		config.durationScale = 1.75;
		config.command = 'open 🚀';
		config.mistypedCommand = 'opne 🚀';
		config.timing.characterDelaysMs = [75, 125];
		config.timing.loadingSteps.push({ label: 'Checking session', durationMs: 4321 });
		config.timing.motion.exitFadeMs = 1234;
		const dialog = createDialog(config);
		let elapsed = 0;
		await playTerminal(dialog, typo, async ms => { elapsed += ms; return true; }, config);
		assert.equal(elapsed, terminalDurationMs(typo, config));
		assert.equal(terminalWatchdogMs(typo, config), elapsed + config.safety.presentationSlackMs);
		assert.equal(dialog.dataset.stage, 'done');
		assert.equal(dialog.querySelector('[data-terminal-command]').textContent, config.command);
		assert.equal(dialog.querySelector('[data-terminal-answer]').textContent, config.confirmationAnswer);
		assert.ok(dialog.querySelectorAll().every(step => step.dataset.state === 'complete'));
	});
}

test('time scaling includes visual motion and does not mutate the settings', () => {
	const config = structuredClone(TERMINAL_CONFIG);
	config.durationScale = 2;
	const before = structuredClone(config);
	const timing = createTerminalTiming(config);
	assert.equal(timing.motion.cursorBlinkMs, config.timing.motion.cursorBlinkMs * 2);
	assert.equal(timing.motion.exitFadeMs, config.timing.motion.exitFadeMs * 2);
	assert.equal(timing.loadingSteps[0].durationMs, config.timing.loadingSteps[0].durationMs * 2);
	assert.deepEqual(config, before);
});

test('invalid timing fails before publication instead of trapping visitors', () => {
	const edits = [
		config => { config.durationScale = 0; },
		config => { config.timing.blankPromptMs = -1; },
		config => { config.timing.characterDelaysMs = []; },
		config => { config.timing.spaceDelayMs = NaN; },
		config => { config.timing.loadingSteps = []; },
		config => { config.timing.motion.cursorBlinkMs = Infinity; },
		config => { config.typoEveryVisits = 2.5; },
		config => { config.safety.downloadTimeoutMs = 0; },
		config => { config.durationScale = 1_000_000; },
	];
	for (const edit of edits) {
		const config = structuredClone(TERMINAL_CONFIG);
		edit(config);
		assert.throws(() => terminalWatchdogMs(true, config));
	}
});

test('cancellation stops the sequence before any subsequent output', async () => {
	const dialog = createDialog(TERMINAL_CONFIG);
	let calls = 0;
	await playTerminal(dialog, false, async () => { calls++; return false; });
	assert.equal(calls, 1);
	assert.equal(dialog.dataset.stage, 'booting');
	assert.equal(dialog.querySelector('[data-terminal-command]').textContent, '');
});
