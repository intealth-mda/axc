type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'courses', 'decisions/0001-course-catalog-fixture'],
} satisfies SidebarsConfig;

module.exports = sidebars;
