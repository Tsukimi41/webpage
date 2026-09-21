import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { icons as deviconIcons } from '@iconify-json/devicon';
import { icons as simpleIcons } from '@iconify-json/simple-icons';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(workspaceRoot, 'public', 'icons', 'skills');

const deviconSpecs = [
	['ros-2', 'ROS 2', 'ros'],
	['arch-linux', 'Arch Linux', 'archlinux'],
	['github', 'GitHub', 'github'],
	['python', 'Python', 'python'],
	['node-js', 'Node.js', 'nodejs'],
	['c', 'C', 'c'],
	['cpp', 'C++', 'cplusplus'],
	['docker', 'Docker', 'docker'],
	['latex', 'LaTeX', 'latex'],
	['vite', 'Vite', 'vitejs'],
	['typescript', 'TypeScript', 'typescript'],
	['html', 'HTML', 'html5'],
	['css', 'CSS', 'css3'],
	['opencv', 'OpenCV', 'opencv'],
	['ubuntu', 'Ubuntu', 'ubuntu'],
	['matlab', 'MATLAB', 'matlab'],
	['raspberry-pi-pico-2-w', 'Raspberry Pi Pico 2 W', 'raspberrypi'],
	['godot', 'Godot', 'godot'],
	['astro', 'Astro', 'astro'],
	['markdown', 'Markdown', 'markdown'],
	['github-actions', 'GitHub Actions', 'githubactions'],
];

const simpleIconSpecs = [
	['wsl-2', 'WSL 2', 'windowsterminal', '#4d4d4d'],
	['xampp-control-panel', 'XAMPP Control Panel', 'xampp', '#fb7a24'],
	['font-awesome', 'Font Awesome', 'fontawesome', '#538dd7'],
];

const customIconSpecs = [
	['aruco-marker', 'ArUco Marker', '#111827', 'aruco'],
	['mixamo', 'Mixamo', '#ea5b24', 'mixamo'],
	['amt-viewpoint', 'AMT Viewpoint', '#006f84', 'encoder'],
	['voicevox', 'VOICEVOX', '#f4c542', 'voice'],
	['solidworks', 'SOLIDWORKS', '#f8fafc', 'solidworks'],
	['lapis-lexide', 'Lapis LEXIDE', '#005bac', 'lexide'],
	['vroid-studio-2-8-0', 'VRoid Studio 2.8.0', '#00a6d6', 'vroid'],
	['n1mm-logger-plus', 'N1MM Logger+', '#174a8b', 'radio'],
];

function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function svgDocument(title, body, provenance) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
	<title>${escapeXml(title)}</title>
	<metadata>${escapeXml(provenance)}</metadata>
	${body}
</svg>
`;
}

function createCollectionIcon(title, iconSet, iconName, color, provenance) {
	const icon = iconSet.icons[iconName];
	if (!icon) throw new Error(`Missing icon glyph: ${iconName}`);
	const body = color ? icon.body.replaceAll('currentColor', color) : icon.body;

	return svgDocument(
		title,
		`<rect width="128" height="128" rx="26" fill="#f8fafc"/>
	<svg x="18" y="18" width="92" height="92" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">${body}</svg>`,
		provenance,
	);
}

function createCustomMark(kind, color) {
	switch (kind) {
		case 'aruco':
			return `<rect x="24" y="24" width="80" height="80" rx="4" fill="#fff" stroke="#111827" stroke-width="8"/>
	<path fill="#111827" d="M32 32h16v16H32zm32 0h16v16H64zm16 16h16v16H80zM48 48h16v16H48zM32 64h16v16H32zm32 0h16v16H64zm16 16h16v16H80zM48 80h16v16H48z"/>`;
		case 'mixamo':
			return `<path d="M31 94V34h13l20 25 20-25h13v60H81V58L64 79 47 58v36z" fill="#fff"/>
	<circle cx="64" cy="64" r="47" fill="none" stroke="#fff" stroke-width="5" opacity=".36"/>`;
		case 'encoder':
			return `<circle cx="64" cy="64" r="43" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="9 6"/>
	<circle cx="64" cy="64" r="25" fill="none" stroke="#fff" stroke-width="6"/>
	<path d="M64 64 88 43" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
	<circle cx="64" cy="64" r="7" fill="#fff"/>`;
		case 'voice':
			return `<path d="M27 30h74v52H68L48 99V82H27z" fill="#222"/>
	<path d="m46 47 18 25 18-25" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
		case 'solidworks':
			return `<path d="M24 42c11-12 30-9 36 4l-11 6c-3-6-11-7-16-2-4 4-2 10 5 12l12 5c15 5 17 22 6 30-12 9-31 5-38-8l11-7c4 8 14 9 20 4 4-4 2-9-5-12l-12-4c-15-5-18-19-8-28Z" fill="#d71920"/>
	<path d="m64 87 11-42h12l5 23 6-23h12L98 87H87l-6-25-6 25Z" fill="#005386"/>`;
		case 'lexide':
			return `<path d="m48 34-24 30 24 30M80 34l24 30-24 30" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="m72 27-16 74" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".72"/>`;
		case 'vroid':
			return `<circle cx="64" cy="48" r="23" fill="#fff"/>
	<path d="M28 105c3-24 18-37 36-37s33 13 36 37z" fill="#fff"/>
	<path d="m43 30 9-13 12 9 12-9 9 13" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>`;
		case 'radio':
			return `<path d="M46 91h36V53H46zm10-28h16v18H56z" fill="#fff"/>
	<path d="M64 53V28M38 42c-12 13-12 31 0 44M90 42c12 13 12 31 0 44M27 31C7 52 7 80 27 99M101 31c20 21 20 49 0 68" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
		default:
			throw new Error(`Unsupported custom icon kind: ${kind}`);
	}
}

function createCustomIcon(title, color, kind) {
	return svgDocument(
		title,
		`<rect width="128" height="128" rx="26" fill="${color}"/>
	${createCustomMark(kind, color)}`,
		'Project-local service-specific mark; not an official vendor asset',
	);
}

await mkdir(outputDirectory, { recursive: true });

for (const [id, title, iconName] of deviconSpecs) {
	await writeFile(
		path.join(outputDirectory, `${id}.svg`),
		createCollectionIcon(title, deviconIcons, iconName, undefined, 'Devicon; MIT license'),
		'utf8',
	);
}

for (const [id, title, iconName, color] of simpleIconSpecs) {
	await writeFile(
		path.join(outputDirectory, `${id}.svg`),
		createCollectionIcon(title, simpleIcons, iconName, color, 'Simple Icons; CC0-1.0 license'),
		'utf8',
	);
}

for (const [id, title, color, kind] of customIconSpecs) {
	await writeFile(
		path.join(outputDirectory, `${id}.svg`),
		createCustomIcon(title, color, kind),
		'utf8',
	);
}

console.log(`Generated ${deviconSpecs.length + simpleIconSpecs.length + customIconSpecs.length} skill icon images.`);
