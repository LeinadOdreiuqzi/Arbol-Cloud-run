const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/, // This matches .md and .mdx
  options: {
    remarkPlugins: [
      require('./lib/remark-wikilink.js')
    ],
  },
});

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
});