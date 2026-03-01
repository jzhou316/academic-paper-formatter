# Academic Paper Formatter

A Chrome extension that extracts paper metadata from academic websites and formats it for easy copying to GitHub notes or Google Docs.

## Features

- 📄 Extract paper title, year, month, venue, and link
- 🔗 Three output formats:
  - **Markdown** - Linked text format for GitHub/Markdown editors
  - **Linked Text** - Rich text with clickable link for Google Docs
  - **Plain Text** - Title and URL on separate lines for Slack/plain text

## Supported Websites

- **ArXiv** (arxiv.org) - Abstract and PDF pages
- **ACL Anthology** (aclanthology.org) - Abstract and PDF pages
- **ACM Digital Library** (dl.acm.org) - Abstract and PDF pages
- **CVF Open Access** (openaccess.thecvf.com) - CVPR, ICCV, ECCV, WACV (HTML and PDF)
- **NeurIPS** (papers.nips.cc, proceedings.neurips.cc) - Abstract and PDF pages
- **OpenReview** (openreview.net) - Forum and PDF pages
- **IEEE Xplore** (ieeexplore.ieee.org)
- **Springer** (springer.com, link.springer.com)

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension folder

## Usage

1. Navigate to a paper page on any supported website
2. Click the extension icon in your Chrome toolbar
3. Review the extracted information
4. Click one of the three copy buttons:
   - **Copy as Markdown** - Creates `[(date) [venue] Title](url)`
   - **Copy as Linked Text** - Creates rich text link for Google Docs
   - **Copy as Plain Text** - Creates plain text with title and URL

## Output Format Examples

**Markdown:**
```markdown
[(2024, December) [NeurIPS 2024] Training-Free Adaptive Diffusion](https://papers.nips.cc/...)
```

**Plain Text:**
```
(2024, December) [NeurIPS 2024] Training-Free Adaptive Diffusion
https://papers.nips.cc/...
```

## File Structure

```
academic-paper-formatter/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Main extraction and formatting logic
├── icon16.svg         # Extension icon (16x16)
├── icon48.svg         # Extension icon (48x48)
├── icon128.svg        # Extension icon (128x128)
└── README.md          # This file
```

## Contributing

Contributions are welcome! If you'd like to add support for additional academic websites or improve existing extractors, please submit a pull request.

## License

MIT License - feel free to use and modify as needed.

## Acknowledgments

Built to streamline the process of maintaining paper reading lists and literature review notes.
