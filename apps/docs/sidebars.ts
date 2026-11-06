type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'api/courses', 'api/enrollment-requests', 'decisions/0001-in-memory-training', 'traceability'],
} satisfies SidebarsConfig;

module.exports = sidebars;
