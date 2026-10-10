import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Keep the original artwork; regenerate the small delivery assets with this script.
const ico = await readFile(new URL('../public/favicon.ico', import.meta.url));
const frames = Array.from({ length: ico.readUInt16LE(4) }, (_, index) => {
	const at = 6 + index * 16;
	const offset = ico.readUInt32LE(at + 12);
	return { size: ico[at] || 256, data: ico.subarray(offset, offset + ico.readUInt32LE(at + 8)) };
}).sort((a, b) => b.size - a.size);
if (!frames[0]?.data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
	throw new Error('Expected a PNG frame in favicon.ico.');
}
await mkdir(new URL('../public/images/', import.meta.url), { recursive: true });
const assets = [
	['images/profile.webp', frames[0].data, 256],
	['images/profile-128.webp', frames[0].data, 128],
	['icons/skills/voicevox.webp', await readFile(new URL('../public/icons/skills/voicevox.png', import.meta.url)), 256],
	['icons/skills/wsl-2.webp', await readFile(new URL('../public/icons/skills/wsl-2.png', import.meta.url)), 380],
];
for (const [name, source, width] of assets) {
	const output = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer();
	await writeFile(new URL(`../public/${name}`, import.meta.url), output);
	console.log(`${name}: ${source.length} -> ${output.length} bytes`);
}
const favicon = new URL('../public/favicon.png', import.meta.url);
await writeFile(favicon, await sharp(frames[0].data).resize(32, 32).png({ compressionLevel: 9 }).toBuffer());
console.log(`favicon.png: ${(await stat(favicon)).size} bytes`);
