import assert from 'node:assert/strict';
import test from 'node:test';

import {
	defineProfileDetailCollection,
	getProfileDetail,
	getProfileDetails,
	profileDetails,
	selectProfileDetails,
} from '../src/content/profile/index.ts';

const validDetail = {
	id: 'test-profile',
	state: 'mock',
	order: 0,
	summary: 'Summary',
	biography: ['Paragraph'],
	interests: [{ id: 'web', title: 'Web', description: 'Description' }],
	principles: [{ id: 'verify', title: 'Verify', description: 'Description' }],
	contact: {
		label: 'Email',
		email: 'hello@example.com',
		note: 'Note',
	},
};

test('profile details are deeply frozen after validation', () => {
	assert.equal(profileDetails.length, 1);

	const [detail] = profileDetails;
	assert.equal(detail.id, 'tsukimi41-profile');
	assert.equal(detail.state, 'published');
	assert.ok(Object.isFrozen(profileDetails));
	assert.ok(Object.isFrozen(detail));
	assert.ok(Object.isFrozen(detail.biography));
	assert.ok(Object.isFrozen(detail.sections));
	assert.ok(Object.isFrozen(detail.sections[0]));
	assert.ok(Object.isFrozen(detail.sections[0].paragraphs));
	assert.ok(Object.isFrozen(detail.sections[0].items));
	assert.ok(Object.isFrozen(detail.interests));
	assert.ok(Object.isFrozen(detail.interests[0]));
	assert.ok(Object.isFrozen(detail.principles));
	assert.ok(Object.isFrozen(detail.principles[0]));
	assert.ok(Object.isFrozen(detail.contact));
});

test('profile queries cover zero, one, multiple, state, and deterministic order', () => {
	const collection = defineProfileDetailCollection([
		{ ...validDetail, id: 'later-profile', order: 20 },
		{ ...validDetail, id: 'earlier-profile', order: 10 },
		{ ...validDetail, id: 'alpha-profile', order: 20 },
		{ ...validDetail, id: 'published-profile', state: 'published', order: 5 },
	]);

	assert.deepEqual(
		selectProfileDetails(collection).map(({ id }) => id),
		['published-profile', 'earlier-profile', 'alpha-profile', 'later-profile'],
	);
	assert.deepEqual(
		selectProfileDetails(collection, { states: ['mock'] }).map(({ id }) => id),
		['earlier-profile', 'alpha-profile', 'later-profile'],
	);
	assert.deepEqual(selectProfileDetails(collection, { limit: 0 }), []);
	assert.deepEqual(
		selectProfileDetails(collection, { limit: 1 }).map(({ id }) => id),
		['published-profile'],
	);
	assert.equal(selectProfileDetails(collection, { limit: 99 }).length, 4);
	assert.ok(Object.isFrozen(selectProfileDetails(collection)));

	assert.equal(getProfileDetails().length, 1);
	assert.equal(getProfileDetails({ states: ['published'] }).length, 1);
	assert.equal(getProfileDetail()?.id, 'tsukimi41-profile');
	assert.equal(getProfileDetail({ states: ['published'] })?.id, 'tsukimi41-profile');
});

test('profile queries reject invalid limits', () => {
	for (const limit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		assert.throws(() => selectProfileDetails(profileDetails, { limit }), /limit/i);
	}
});

test('profile details allow empty optional lists and an omitted contact', () => {
	const [detail] = defineProfileDetailCollection([
		{
			...validDetail,
			interests: [],
			principles: [],
			contact: undefined,
		},
	]);

	assert.deepEqual(detail.interests, []);
	assert.deepEqual(detail.principles, []);
	assert.equal(detail.contact, undefined);
});

test('profile detail validation rejects incomplete or unstable records', () => {
	const invalidRecords = [
		{ ...validDetail, summary: '' },
		{ ...validDetail, biography: [] },
		{ ...validDetail, biography: [' '] },
		{
			...validDetail,
			interests: [{ id: 'Not Stable', title: 'Web', description: 'Description' }],
		},
		{
			...validDetail,
			sections: [{ id: 'empty-section', title: 'Empty', paragraphs: [], items: [] }],
		},
		{
			...validDetail,
			sections: [
				{ id: 'duplicate', title: 'One', paragraphs: ['Text'], items: [] },
				{ id: 'duplicate', title: 'Two', paragraphs: ['Text'], items: [] },
			],
		},
		{
			...validDetail,
			interests: [
				{ id: 'web', title: 'Web', description: 'Description' },
				{ id: 'web', title: 'Duplicate', description: 'Description' },
			],
		},
		{
			...validDetail,
			principles: [
				{ id: 'verify', title: 'Verify', description: 'Description' },
				{ id: 'verify', title: 'Duplicate', description: 'Description' },
			],
		},
		{
			...validDetail,
			interests: [{ id: 'web', title: '', description: 'Description' }],
		},
		{
			...validDetail,
			principles: [{ id: 'verify', title: 'Verify', description: '' }],
		},
		{ ...validDetail, contact: { ...validDetail.contact, label: '' } },
		{ ...validDetail, contact: { ...validDetail.contact, email: 'invalid' } },
		{ ...validDetail, contact: { ...validDetail.contact, note: '' } },
		{ ...validDetail, contact: { ...validDetail.contact, note: ' ' } },
	];

	for (const record of invalidRecords) {
		assert.throws(() => defineProfileDetailCollection([record]));
	}
});

test('profile detail collections reject duplicate record ids', () => {
	assert.throws(
		() => defineProfileDetailCollection([validDetail, { ...validDetail }]),
		/duplicate/i,
	);
});
