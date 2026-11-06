type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'api/courses', 'api/enrollment-requests', 'decisions/training-workflow'],
} satisfies SidebarsConfig;

module.exports = sidebars;
