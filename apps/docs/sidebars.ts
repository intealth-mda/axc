type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'courses', 'enrollment-requests', 'adr/0001-course-catalog-search', 'adr/0002-enrollment-request-workflow'],
} satisfies SidebarsConfig;

module.exports = sidebars;
