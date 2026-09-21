import { blogPosts, blogTags } from '../src/content/blog/index.ts';
import {
	assertPublicContentSelection,
	createPublicationReport,
} from '../src/content/core/publication.ts';
import { profileDetails } from '../src/content/profile/index.ts';
import { projects } from '../src/content/projects/index.ts';
import { skills } from '../src/content/skills/index.ts';

const groups = Object.freeze([
	Object.freeze({ name: 'projects', records: projects }),
	Object.freeze({ name: 'skills', records: skills }),
	Object.freeze({ name: 'blogPosts', records: blogPosts }),
	Object.freeze({ name: 'blogTags', records: blogTags }),
	Object.freeze({ name: 'profileDetails', records: profileDetails }),
]);

const report = createPublicationReport(groups);
const publicGroups = groups.map((group) => ({
	name: group.name,
	records: group.records.filter((record) => record.state === 'published'),
}));

assertPublicContentSelection(publicGroups);

console.log('Publication content report');
console.log(`total=${report.total} public=${report.public} private=${report.private}`);
console.log(
	`mock=${report.states.mock} draft=${report.states.draft} published=${report.states.published} archived=${report.states.archived}`,
);

for (const group of report.groups) {
	console.log(
		`${group.name}: total=${group.total} public=${group.public} private=${group.private}`,
	);
}

console.log('relationshipChecks=passed');
