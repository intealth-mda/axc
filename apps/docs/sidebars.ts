type SidebarsConfig = import('@docusaurus/plugin-content-docs').SidebarsConfig;

const sidebars = {
	docs: ['intro', 'healthcheck', 'enrollment-requests'],
} satisfies SidebarsConfig;

module.exports = sidebars;
