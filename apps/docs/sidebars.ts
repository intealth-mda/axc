type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: [
		'intro',
		'healthcheck',
		'courses',
		'enrollment-requests',
		{
			type: 'category',
			label: 'Decisions',
			items: ['decisions/course-catalog-search', 'decisions/enrollment-request-workflow'],
		},
	],
} satisfies SidebarsConfig;

module.exports = sidebars;
