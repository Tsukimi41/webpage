/**
 * WezTerm入口の調整は、このオブジェクトだけを編集する。
 * 単位はミリ秒（1000ms = 1秒）。大きくするとゆっくりになる。
 * 編集後: npm run terminal:timing → npm run build:release
 */
export const TERMINAL_CONFIG = {
	// 全演出の時間倍率。0.5で2倍速、2で半分の速さ。通信待ち制限には適用しない。
	durationScale: 1,
	// 3なら3回に1回打ち直す。0で打ち間違いを無効にする。
	typoEveryVisits: 3,
	command: 'open ./portfolio',
	mistypedCommand: 'opne ./portfolio',
	confirmation: 'Open ./portfolio? [Y/n]',
	confirmationAnswer: 'y',
	errorMessage: 'zsh: command not found: opne',
	readyMessage: ':: Session ready. Opening portfolio.',
	timing: {
		blankPromptMs: 2500, // 最初の空のプロンプト
		systemInfoMs: 2000, // Arch情報を読む時間
		beforeTypingMs: 3500, // openを打ち始める前
		characterDelaysMs: [138, 180, 150, 220], // 1文字ずつ、この順を繰り返す
		spaceDelayMs: 450, // スペースを入力するときの間
		beforeExecuteMs: 2000, // コマンドが打ち終わってから実行まで
		confirmationWaitMs: 2000, // [Y/n]への返答前
		confirmationAnswerMs: 800, // 自動入力したyを表示する時間
		// 行の追加・削除や、それぞれの待ち時間もここだけで変更する。
		loadingSteps: [
			{ label: 'Resolving ./portfolio', durationMs: 1800 },
			{ label: 'Starting browser session', durationMs: 1800 },
			{ label: 'Opening index.html', durationMs: 1800 },
		],
		readyMs: 2200, // 完了メッセージを読む時間
		typo: {
			beforeErrorMs: 1200, // 誤入力を実行する前
			errorMs: 1500, // エラーを読む時間
			recallMs: 650, // 履歴を呼び戻した後
			eraseCharacterMs: 60, // 1文字消す時間
			beforeRetryMs: 1500, // 消し終わってから再入力まで
		},
		motion: {
			windowEnterMs: 180, // ターミナル枠の登場
			cursorBlinkMs: 1200, // カーソルの点滅1周期
			spinnerCycleMs: 800, // 文字スピナー1周
			exitFadeMs: 800, // ターミナルと背景のフェード
			exitBufferMs: 20, // フェード完了後に閉じるまでの余裕
		},
	},
	// 通信やタイマーの停滞対策。演出時間と別に管理する。
	safety: {
		downloadTimeoutMs: 16000,
		presentationSlackMs: 12000, // 計算した演出の総時間に加える余裕
	},
};

export type TerminalConfig = typeof TERMINAL_CONFIG;
