type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'courses', 'adr/0001-course-catalog-search'],
} satisfies SidebarsConfig;

module.exports = sidebars;
