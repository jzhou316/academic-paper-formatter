let paperData = null;
const diagnosisDiv = document.getElementById('diagnosis');

function addDiagnosis(message) {
  if (diagnosisDiv) {
    diagnosisDiv.style.display = 'block';
    diagnosisDiv.innerHTML += message + '<br>';
  }
  console.log('[Diagnosis]', message);
}

addDiagnosis('Popup script loaded');

function extractPaperInfo() {
  const url = window.location.href;
  console.log('[Extract] Starting extraction for URL:', url);
  console.log('[Extract] URL includes papers.nips.cc?', url.includes('papers.nips.cc'));
  console.log('[Extract] URL includes papers.neurips.cc?', url.includes('papers.neurips.cc'));
  let title = '';
  let year = '';
  let month = '';
  let venue = '';
  let link = url;

  // CVF (CVPR, ICCV, ECCV) - openaccess.thecvf.com
  if (url.includes('openaccess.thecvf.com')) {
    console.log('[Extract] Detected CVF conference page');
    
    // If on PDF page, convert to HTML page
    if (url.endsWith('.pdf')) {
      const htmlUrl = url.replace('/papers/', '/html/').replace('_paper.pdf', '_paper.html');
      console.log('[Extract] PDF detected, fetching HTML page:', htmlUrl);
      
      return fetch(htmlUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Extract from URL
          const urlMatch = htmlUrl.match(/\/(CVPR|ICCV|ECCV|WACV)(\d{4})\//i);
          if (urlMatch) {
            venue = urlMatch[1].toUpperCase();
            year = urlMatch[2];
            
            if (venue === 'CVPR' || venue === 'WACV') {
              month = 'June';
            } else if (venue === 'ICCV') {
              month = 'October';
            } else if (venue === 'ECCV') {
              month = 'October';
            }
          }
          
          // Get title
          const pageTitle = doc.title;
          if (pageTitle) {
            title = pageTitle.trim();
          }
          
          if (!title || title.length < 10) {
            const titleEl = doc.querySelector('h1') || doc.querySelector('#papertitle');
            if (titleEl) {
              title = titleEl.textContent.trim();
            }
          }
          
          // Try BibTeX
          const codeBlocks = doc.querySelectorAll('pre, code');
          for (const block of codeBlocks) {
            const text = block.textContent;
            if (text.includes('@InProceedings') || text.includes('@inproceedings')) {
              const titleMatch = text.match(/title\s*=\s*["{]([^"}]+)["}]/i);
              const yearMatch = text.match(/year\s*=\s*["{](\d{4})["}]/i);
              const monthMatch = text.match(/month\s*=\s*["{](\w+)["}]/i);
              
              if (titleMatch && !title) title = titleMatch[1].trim();
              if (yearMatch && !year) year = yearMatch[1];
              if (monthMatch && !month) month = monthMatch[1];
              break;
            }
          }
          
          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: htmlUrl
          };
        })
        .catch(err => {
          console.error('[Extract] Error fetching HTML page:', err);
          return {
            title: 'Unknown Title',
            year: 'Unknown Year',
            month: '',
            venue: '',
            link: htmlUrl
          };
        });
    }
    
    // On HTML page - extract directly
    // Extract from URL - e.g., /content/CVPR2025/
    const urlMatch = url.match(/\/(CVPR|ICCV|ECCV|WACV)(\d{4})\//i);
    if (urlMatch) {
      venue = urlMatch[1].toUpperCase();
      year = urlMatch[2];
      console.log('[Extract] Extracted from URL - Venue:', venue, 'Year:', year);
      
      // Set typical months for each conference
      if (venue === 'CVPR' || venue === 'WACV') {
        month = 'June';
      } else if (venue === 'ICCV') {
        month = 'October';
      } else if (venue === 'ECCV') {
        month = 'October';
      }
    }
    
    // Get title from page title or h1
    const pageTitle = document.title;
    if (pageTitle) {
      title = pageTitle.trim();
      console.log('[Extract] Page title:', title);
    }
    
    // Try to get title from heading if page title doesn't work
    if (!title || title.length < 10) {
      const titleEl = document.querySelector('h1') || document.querySelector('#papertitle');
      if (titleEl) {
        title = titleEl.textContent.trim();
      }
    }
    
    // Try to extract from BibTeX if available
    const bibtexLink = document.querySelector('a[href*="bibtex"]');
    if (bibtexLink && !title) {
      // BibTeX data might be in a pre or code block
      const codeBlocks = document.querySelectorAll('pre, code');
      for (const block of codeBlocks) {
        const text = block.textContent;
        if (text.includes('@InProceedings') || text.includes('@inproceedings')) {
          const titleMatch = text.match(/title\s*=\s*["{]([^"}]+)["}]/i);
          const yearMatch = text.match(/year\s*=\s*["{](\d{4})["}]/i);
          const monthMatch = text.match(/month\s*=\s*["{](\w+)["}]/i);
          
          if (titleMatch && !title) title = titleMatch[1].trim();
          if (yearMatch && !year) year = yearMatch[1];
          if (monthMatch && !month) month = monthMatch[1];
          
          console.log('[Extract] Extracted from BibTeX:', { title, year, month });
          break;
        }
      }
    }
    
    console.log('[Extract] Final CVF extraction:', { title, year, month, venue });
  }

  // NeurIPS (papers.nips.cc)
  else if (url.includes('papers.nips.cc') || url.includes('papers.neurips.cc') || url.includes('proceedings.neurips.cc')) {
    console.log('[Extract] Detected NeurIPS page');
    
    // Handle proceedings.neurips.cc PDF URLs
    if (url.includes('proceedings.neurips.cc') && url.includes('/file/') && url.endsWith('.pdf')) {
      // Convert PDF URL to abstract page URL
      // From: /paper_files/paper/2024/file/c63819755591ea972f8570beffca6b1b-Paper-Datasets_and_Benchmarks_Track.pdf
      // To: /paper_files/paper/2024/hash/c63819755591ea972f8570beffca6b1b-Abstract-Conference.html
      // Extract the hash part
      const hashMatch = url.match(/\/file\/([a-f0-9]+)-Paper/i);
      let abstractUrl = url;
      
      if (hashMatch) {
        const hash = hashMatch[1];
        abstractUrl = url.replace(/\/file\/[^/]+\.pdf$/, `/hash/${hash}-Abstract-Conference.html`);
      } else {
        // Fallback: simple replacement
        abstractUrl = url.replace('/file/', '/hash/').replace(/-Paper-.*\.pdf$/, '-Abstract-Conference.html');
      }
      
      console.log('[Extract] proceedings.neurips.cc PDF detected');
      console.log('[Extract] Original URL:', url);
      console.log('[Extract] Abstract URL:', abstractUrl);
      
      return fetch(abstractUrl)
        .then(response => {
          console.log('[Extract] Fetch response status:', response.status);
          if (!response.ok) {
            throw new Error('Failed to fetch abstract page');
          }
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          console.log('[Extract] Fetched HTML, length:', html.length);
          
          // Extract year from URL
          const urlMatch = abstractUrl.match(/\/paper\/(\d{4})\//);
          if (urlMatch) {
            year = urlMatch[1];
            venue = 'NeurIPS ' + year;
            month = 'December';
            console.log('[Extract] Year from URL:', year);
          }
          
          // Get title from page title
          const pageTitle = doc.title;
          if (pageTitle) {
            title = pageTitle.trim();
            console.log('[Extract] Title from page title:', title);
          }
          
          // Also try h4 element
          if (!title || title.length < 10) {
            const h4 = doc.querySelector('h4');
            if (h4) {
              title = h4.textContent.trim();
              console.log('[Extract] Title from h4:', title);
            }
          }
          
          // Try JSON-LD
          const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
          console.log('[Extract] Found', scriptTags.length, 'JSON-LD script tags');
          
          for (const script of scriptTags) {
            try {
              const data = JSON.parse(script.textContent);
              console.log('[Extract] JSON-LD data:', data);
              if (data.title) {
                title = data.title;
                console.log('[Extract] Title from JSON-LD:', title);
              }
              if (data.published && data.published.year) {
                year = data.published.year;
                if (data.published.month) {
                  const monthNum = parseInt(data.published.month);
                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                    'July', 'August', 'September', 'October', 'November', 'December'];
                  month = monthNames[monthNum - 1];
                }
              }
            } catch (e) {
              console.log('[Extract] Error parsing JSON-LD:', e);
            }
          }
          
          console.log('[Extract] Final proceedings.neurips.cc extraction:', { title, year, month, venue });
          
          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: abstractUrl
          };
        })
        .catch(err => {
          console.error('[Extract] Error fetching abstract page:', err);
          // Fallback: at least get year from URL
          const urlMatch = url.match(/\/paper\/(\d{4})\//);
          let fallbackYear = '';
          let fallbackVenue = '';
          if (urlMatch) {
            fallbackYear = urlMatch[1];
            fallbackVenue = 'NeurIPS ' + fallbackYear;
          }
          const hashMatch = url.match(/\/file\/([a-f0-9]+)-Paper/i);
          let abstractUrl = url;
          if (hashMatch) {
            const hash = hashMatch[1];
            abstractUrl = url.replace(/\/file\/[^/]+\.pdf$/, `/hash/${hash}-Abstract-Conference.html`);
          } else {
            abstractUrl = url.replace('/file/', '/hash/').replace(/-Paper-.*\.pdf$/, '-Abstract-Conference.html');
          }
          
          return {
            title: 'Unknown Title',
            year: fallbackYear || 'Unknown Year',
            month: 'December',
            venue: fallbackVenue || '',
            link: abstractUrl
          };
        });
    }
    
    // Method 1: Extract year from URL (most reliable)
    const urlMatch = url.match(/\/paper\/(\d{4})\//);
    if (urlMatch) {
      year = urlMatch[1];
      venue = 'NeurIPS ' + year;
      month = 'December';
      console.log('[Extract] Extracted from URL - Year:', year);
    }
    
    // Method 2: Try to get title from document.title
    const pageTitle = document.title;
    if (pageTitle) {
      title = pageTitle.trim();
      console.log('[Extract] Page title:', title);
    }
    
    // Method 3: Try to extract from JSON-LD structured data
    const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
    console.log('[Extract] Found', scriptTags.length, 'JSON-LD script tags');
    
    for (const script of scriptTags) {
      try {
        const data = JSON.parse(script.textContent);
        console.log('[Extract] Parsed structured data:', data);
        if (data.title) {
          title = data.title; // Override with structured data if available
        }
        if (data.published && data.published.year) {
          year = data.published.year;
          if (data.published.month) {
            const monthNum = parseInt(data.published.month);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            month = monthNames[monthNum - 1];
          }
        }
        if (data.journal && !venue) {
          const venueMatch = data.journal.match(/(NeurIPS|NIPS)/i);
          if (venueMatch && year) {
            venue = 'NeurIPS ' + year;
          } else {
            venue = data.journal;
          }
        }
      } catch (e) {
        console.log('[Extract] Error parsing JSON-LD:', e);
      }
    }
    
    console.log('[Extract] After all extraction methods:', { title, year, month, venue });
  }

  // ArXiv detection
  else if (url.includes('arxiv.org')) {
    console.log('[Extract] Detected ArXiv');
    // If on PDF page, redirect to abstract page for extraction
    if (url.includes('/pdf/')) {
      const absUrl = url.replace('/pdf/', '/abs/').replace('.pdf', '');
      // For PDF pages, we need to fetch the abstract page
      return fetch(absUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Title
          const titleEl = doc.querySelector('h1.title');
          if (titleEl) {
            title = titleEl.textContent.replace('Title:', '').trim();
          }

          // Date
          const dateEl = doc.querySelector('.dateline') || 
                         doc.querySelector('.submission-history');
          if (dateEl) {
            const dateText = dateEl.textContent;
            const dateMatch = dateText.match(/\[Submitted.*?(\d{1,2})\s+(\w+)\s+(\d{4})/i) ||
                             dateText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
            if (dateMatch) {
              year = dateMatch[3];
              month = dateMatch[2];
            }
          }

          // Venue from comments
          const commentsEl = doc.querySelector('.tablecell.comments');
          if (commentsEl) {
            const commentText = commentsEl.textContent;
            const venuePatterns = [
              /Published in (.*?)(?:\.|$)/i,
              /Accepted (?:to|at) (.*?)(?:\.|$)/i,
              /Appears in (.*?)(?:\.|$)/i,
              /(CVPR|ICCV|ECCV|NeurIPS|ICML|ICLR|ACL|EMNLP|NAACL|AAAI|IJCAI)\s*\d{4}/i
            ];
            
            for (const pattern of venuePatterns) {
              const match = commentText.match(pattern);
              if (match) {
                venue = match[1] || match[0];
                break;
              }
            }
          }

          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: absUrl
          };
        })
        .catch(err => {
          console.error('Error fetching abstract page:', err);
          // Fallback to basic extraction
          return {
            title: 'Unknown Title',
            year: 'Unknown Year',
            month: '',
            venue: '',
            link: absUrl
          };
        });
    }

    // Title
    const titleEl = document.querySelector('h1.title');
    if (titleEl) {
      title = titleEl.textContent.replace('Title:', '').trim();
    }

    // Date - try multiple selectors
    const dateEl = document.querySelector('.dateline') || 
                   document.querySelector('.submission-history');
    if (dateEl) {
      const dateText = dateEl.textContent;
      const dateMatch = dateText.match(/\[Submitted.*?(\d{1,2})\s+(\w+)\s+(\d{4})/i) ||
                       dateText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (dateMatch) {
        year = dateMatch[3];
        month = dateMatch[2];
      }
    }

    // Venue from comments
    const commentsEl = document.querySelector('.tablecell.comments');
    if (commentsEl) {
      const commentText = commentsEl.textContent;
      // Look for common venue patterns
      const venuePatterns = [
        /Published in (.*?)(?:\.|$)/i,
        /Accepted (?:to|at) (.*?)(?:\.|$)/i,
        /Appears in (.*?)(?:\.|$)/i,
        /(CVPR|ICCV|ECCV|NeurIPS|ICML|ICLR|ACL|EMNLP|NAACL|AAAI|IJCAI)\s*\d{4}/i
      ];
      
      for (const pattern of venuePatterns) {
        const match = commentText.match(pattern);
        if (match) {
          venue = match[1] || match[0];
          break;
        }
      }
    }

    // Make sure we have the abstract page URL
    if (url.includes('/pdf/')) {
      link = url.replace('/pdf/', '/abs/').replace('.pdf', '');
    }
  }
  // ACL Anthology
  else if (url.includes('aclanthology.org')) {
    console.log('[Extract] Detected ACL');
    // If on PDF page, fetch the abstract page
    if (url.endsWith('.pdf')) {
      const absUrl = url.replace('.pdf', '/');
      return fetch(absUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Title
          const titleEl = doc.querySelector('h2#title') || doc.querySelector('h2');
          if (titleEl) title = titleEl.textContent.trim();

          // Look for the metadata in dl elements
          const dtElements = doc.querySelectorAll('dt');
          const ddElements = doc.querySelectorAll('dd');
          
          for (let i = 0; i < dtElements.length; i++) {
            const label = dtElements[i].textContent.trim().toLowerCase();
            const value = ddElements[i]?.textContent.trim();
            
            if (label.includes('venue') && value) {
              venue = value;
            }
            if (label.includes('month') && value) {
              month = value;
            }
            if (label.includes('year') && value) {
              year = value;
            }
          }
          
          // If still no venue, try the breadcrumb or link
          if (!venue) {
            const venueEl = doc.querySelector('a[href*="/venues/"]');
            if (venueEl) venue = venueEl.textContent.trim();
          }
          
          // Try extracting from citation format if metadata not found
          if (!year || !month) {
            const citationBlock = doc.querySelector('code') || doc.querySelector('pre');
            if (citationBlock) {
              const citationText = citationBlock.textContent;
              const yearMatch = citationText.match(/year\s*=\s*["{](\d{4})["}]/i);
              const monthMatch = citationText.match(/month\s*=\s*(\w+)/i);
              if (yearMatch && !year) year = yearMatch[1];
              if (monthMatch && !month) month = monthMatch[1];
            }
          }

          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: absUrl
          };
        })
        .catch(err => {
          console.error('Error fetching abstract page:', err);
          return {
            title: 'Unknown Title',
            year: 'Unknown Year',
            month: '',
            venue: '',
            link: absUrl
          };
        });
    }

    // Title
    const titleEl = document.querySelector('h2#title') || document.querySelector('h2');
    if (titleEl) title = titleEl.textContent.trim();

    // Look for the metadata in dl elements
    const dtElements = document.querySelectorAll('dt');
    const ddElements = document.querySelectorAll('dd');
    
    for (let i = 0; i < dtElements.length; i++) {
      const label = dtElements[i].textContent.trim().toLowerCase();
      const value = ddElements[i]?.textContent.trim();
      
      if (label.includes('venue') && value) {
        venue = value;
      }
      if (label.includes('month') && value) {
        month = value;
      }
      if (label.includes('year') && value) {
        year = value;
      }
    }
    
    // If still no venue, try the breadcrumb or link
    if (!venue) {
      const venueEl = document.querySelector('a[href*="/venues/"]');
      if (venueEl) venue = venueEl.textContent.trim();
    }
    
    // Try extracting from citation format if metadata not found
    if (!year || !month) {
      const citationBlock = document.querySelector('code') || document.querySelector('pre');
      if (citationBlock) {
        const citationText = citationBlock.textContent;
        const yearMatch = citationText.match(/year\s*=\s*["{](\d{4})["}]/i);
        const monthMatch = citationText.match(/month\s*=\s*(\w+)/i);
        if (yearMatch && !year) year = yearMatch[1];
        if (monthMatch && !month) month = monthMatch[1];
      }
    }
  }
  // ACM Digital Library
  else if (url.includes('dl.acm.org')) {
    console.log('[Extract] Detected ACM');
    
    // If on PDF page, convert to abstract page
    if (url.includes('/doi/pdf/')) {
      const absUrl = url.replace('/doi/pdf/', '/doi/');
      console.log('[Extract] PDF detected, fetching abstract page:', absUrl);
      
      return fetch(absUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          console.log('[Extract] Fetched HTML, length:', html.length);
          
          // Title - try multiple selectors
          let titleEl = doc.querySelector('h1.citation__title');
          if (!titleEl) titleEl = doc.querySelector('h1[class*="title"]');
          if (!titleEl) titleEl = doc.querySelector('.hlFld-Title');
          if (!titleEl) titleEl = doc.querySelector('meta[name="dc.Title"]');
          
          if (titleEl) {
            if (titleEl.tagName === 'META') {
              title = titleEl.getAttribute('content');
            } else {
              title = titleEl.textContent.trim();
            }
            console.log('[Extract] Found title:', title);
          } else {
            console.log('[Extract] No title element found');
          }

          // Venue - try multiple selectors
          let venueEl = doc.querySelector('.epub-section__title');
          if (!venueEl) venueEl = doc.querySelector('.proceedings-title');
          if (!venueEl) venueEl = doc.querySelector('[class*="venue"]');
          if (!venueEl) venueEl = doc.querySelector('.issue-item__detail');
          
          if (venueEl) {
            venue = venueEl.textContent.trim();
            console.log('[Extract] Found venue:', venue);
          } else {
            console.log('[Extract] No venue element found');
          }

          // Date - try multiple selectors
          let dateEl = doc.querySelector('.CitationCoverDate');
          if (!dateEl) dateEl = doc.querySelector('.publication-date');
          if (!dateEl) dateEl = doc.querySelector('.epub-date');
          if (!dateEl) dateEl = doc.querySelector('[class*="date"]');
          
          if (dateEl) {
            const dateText = dateEl.textContent;
            console.log('[Extract] Found date text:', dateText);
            const dateMatch = dateText.match(/(\w+)\s+(\d{4})/);
            if (dateMatch) {
              month = dateMatch[1];
              year = dateMatch[2];
            } else {
              // Try just year
              const yearMatch = dateText.match(/(\d{4})/);
              if (yearMatch) year = yearMatch[1];
            }
          } else {
            console.log('[Extract] No date element found');
          }
          
          console.log('[Extract] Final ACM extraction:', { title, year, month, venue });

          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: absUrl
          };
        })
        .catch(err => {
          console.error('[Extract] Error fetching abstract page:', err);
          const absUrl = url.replace('/doi/pdf/', '/doi/');
          return {
            title: 'Unknown Title',
            year: 'Unknown Year',
            month: '',
            venue: '',
            link: absUrl
          };
        });
    }
    
    // On abstract page - extract directly
    let titleEl = document.querySelector('h1.citation__title');
    if (!titleEl) titleEl = document.querySelector('h1[class*="title"]');
    if (!titleEl) titleEl = document.querySelector('.hlFld-Title');
    if (titleEl) title = titleEl.textContent.trim();

    let venueEl = document.querySelector('.epub-section__title');
    if (!venueEl) venueEl = document.querySelector('.proceedings-title');
    if (!venueEl) venueEl = document.querySelector('[class*="venue"]');
    if (venueEl) venue = venueEl.textContent.trim();

    let dateEl = document.querySelector('.CitationCoverDate');
    if (!dateEl) dateEl = document.querySelector('.publication-date');
    if (!dateEl) dateEl = document.querySelector('.epub-date');
    if (dateEl) {
      const dateText = dateEl.textContent;
      const dateMatch = dateText.match(/(\w+)\s+(\d{4})/);
      if (dateMatch) {
        month = dateMatch[1];
        year = dateMatch[2];
      }
    }
  }
  // IEEE Xplore
  else if (url.includes('ieeexplore.ieee.org')) {
    console.log('[Extract] Detected IEEE');
    const titleEl = document.querySelector('.document-title');
    if (titleEl) title = titleEl.textContent.trim();

    const venueEl = document.querySelector('.stats-document-abstract-publishedIn a');
    if (venueEl) venue = venueEl.textContent.trim();

    const dateEl = document.querySelector('.doc-abstract-pubdate');
    if (dateEl) {
      const dateText = dateEl.textContent;
      const dateMatch = dateText.match(/(\w+)\s+(\d{4})/);
      if (dateMatch) {
        month = dateMatch[1];
        year = dateMatch[2];
      }
    }
  }
  // Springer
  else if (url.includes('springer.com') || url.includes('link.springer.com')) {
    console.log('[Extract] Detected Springer');
    const titleEl = document.querySelector('h1.c-article-title');
    if (titleEl) title = titleEl.textContent.trim();

    const venueEl = document.querySelector('.c-journal-title');
    if (venueEl) venue = venueEl.textContent.trim();

    const dateEl = document.querySelector('time[itemprop="datePublished"]');
    if (dateEl) {
      const datetime = dateEl.getAttribute('datetime');
      if (datetime) {
        const date = new Date(datetime);
        year = date.getFullYear().toString();
        month = date.toLocaleString('en-US', { month: 'long' });
      }
    }
  }
    // OpenReview
  else if (url.includes('openreview.net')) {
    console.log('[Extract] Detected OpenReview');
    // If on PDF page, convert to forum page and fetch
    if (url.includes('/pdf?id=')) {
      const forumUrl = url.replace('/pdf?id=', '/forum?id=');
      
      return fetch(forumUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Title
          const titleEl = doc.querySelector('h2.citation_title') || 
                         doc.querySelector('h2[class*="title"]') ||
                         doc.querySelector('.note_content_title');
          if (titleEl) title = titleEl.textContent.trim();

          // Venue - look for conference name
          const venueEl = doc.querySelector('.venue') || 
                         doc.querySelector('[class*="venue"]');
          if (venueEl) venue = venueEl.textContent.trim();

          // Date from meta tags or visible elements
          const dateEl = doc.querySelector('span.date') ||
                        doc.querySelector('[class*="date"]');
          if (dateEl) {
            const dateText = dateEl.textContent.trim();
            const dateMatch = dateText.match(/(\w+)\s+(\d{4})/);
            if (dateMatch) {
              month = dateMatch[1];
              year = dateMatch[2];
            } else {
              const yearMatch = dateText.match(/(\d{4})/);
              if (yearMatch) year = yearMatch[1];
            }
          }

          return {
            title: title || 'Unknown Title',
            year: year || 'Unknown Year',
            month: month || '',
            venue: venue || '',
            link: forumUrl
          };
        })
        .catch(err => {
          console.error('Error fetching forum page:', err);
          const forumUrl = url.replace('/pdf?id=', '/forum?id=');
          return {
            title: 'Unknown Title',
            year: 'Unknown Year',
            month: '',
            venue: '',
            link: forumUrl
          };
        });
    }

    // On forum page already - extract directly
    const titleEl = document.querySelector('h2.citation_title') || 
                   document.querySelector('h2[class*="title"]') ||
                   document.querySelector('.note_content_title');
    if (titleEl) title = titleEl.textContent.trim();

    // Venue
    const venueEl = document.querySelector('.venue') || 
                   document.querySelector('[class*="venue"]');
    if (venueEl) venue = venueEl.textContent.trim();

    // Date
    const dateEl = document.querySelector('span.date') ||
                  document.querySelector('[class*="date"]');
    if (dateEl) {
      const dateText = dateEl.textContent.trim();
      const dateMatch = dateText.match(/(\w+)\s+(\d{4})/);
      if (dateMatch) {
        month = dateMatch[1];
        year = dateMatch[2];
      } else {
        const yearMatch = dateText.match(/(\d{4})/);
        if (yearMatch) year = yearMatch[1];
      }
    }
  }

  console.log('[Extract] Final extracted data:', { title, year, month, venue, link });
  
  return {
    title: title || 'Unknown Title',
    year: year || 'Unknown Year',
    month: month || '',
    venue: venue || '',
    link: link
  };
}

// Extract paper data when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  addDiagnosis('Active tab: ' + tabs[0].url);
  
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      function: extractPaperInfo
    },
    async (results) => {
      addDiagnosis('Script executed, processing results...');
      
      if (chrome.runtime.lastError) {
        addDiagnosis('ERROR: ' + chrome.runtime.lastError.message);
        showError("Error: " + chrome.runtime.lastError.message);
        return;
      }
      
      if (results && results[0]) {
        addDiagnosis('Got results from script');
        try {
          // Handle both direct return and Promise return
          const result = results[0].result;
          addDiagnosis('Result type: ' + typeof result);
          
          if (result && typeof result.then === 'function') {
            addDiagnosis('Result is a Promise, awaiting...');
            paperData = await result;
          } else {
            paperData = result;
          }
          
          addDiagnosis('Paper data: ' + JSON.stringify(paperData).substring(0, 100));
          
          if (paperData && paperData.title) {
            displayInfo(paperData);
            addDiagnosis('✓ Successfully extracted paper info');
          } else {
            addDiagnosis('ERROR: No valid paper data');
            showError("Could not extract paper information from this page.");
          }
        } catch (error) {
          addDiagnosis('ERROR: ' + error.message);
          showError("Error processing data: " + error.message);
        }
      } else {
        addDiagnosis('ERROR: No results returned from script');
        showError("Could not extract paper information from this page.");
      }
    }
  );
});

function displayInfo(data) {
  const infoDiv = document.getElementById('info');
  infoDiv.style.display = 'block';
  
  infoDiv.innerHTML = `
    <div class="info-label">Title:</div>
    <div class="info-value">${data.title}</div>
    <div class="info-label">Date:</div>
    <div class="info-value">${data.year}${data.month ? ', ' + data.month : ''}</div>
    ${data.venue ? `<div class="info-label">Venue:</div><div class="info-value">${data.venue}</div>` : ''}
    <div class="info-label">Link:</div>
    <div class="info-value" style="word-break: break-all;">${data.link}</div>
  `;
}

function formatForMarkdown(data) {
  const dateStr = `${data.year}${data.month ? ', ' + data.month : ''}`;
  const venueStr = data.venue ? `[${data.venue}] ` : '';
  const fullText = `(${dateStr}) ${venueStr}${data.title}`;
  return `[${fullText}](${data.link})`;
}

function formatForGoogleDocs(data) {
  const dateStr = `${data.year}${data.month ? ', ' + data.month : ''}`;
  const venueStr = data.venue ? `[${data.venue}] ` : '';
  const fullText = `(${dateStr}) ${venueStr}${data.title}`;
  return { text: `${fullText}\n${data.link}`, html: `<p><a href="${data.link}">${fullText}</a></p>` };
}

function formatPlainText(data) {
  const dateStr = `${data.year}${data.month ? ', ' + data.month : ''}`;
  const venueStr = data.venue ? `[${data.venue}] ` : '';
  return `(${dateStr}) ${venueStr}${data.title}\n${data.link}`;
}

function showError(message) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = 'error';
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
}

function showSuccess(message) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = 'success';
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 2000);
}

document.getElementById('copyMarkdown').addEventListener('click', () => {
  console.log('Markdown button clicked');
  if (!paperData) {
    showError('No paper data available');
    return;
  }
  
  const formatted = formatForMarkdown(paperData);
  console.log('Formatted markdown:', formatted);
  navigator.clipboard.writeText(formatted).then(() => {
    console.log('Successfully copied to clipboard');
    showSuccess('✓ Copied as Markdown!');
  }).catch(err => {
    console.error('Clipboard error:', err);
    showError('Failed to copy: ' + err.message);
  });
});

document.getElementById('copyGoogleDocs').addEventListener('click', async () => {
  console.log('Google Docs button clicked');
  if (!paperData) {
    showError('No paper data available');
    return;
  }
  
  const formatted = formatForGoogleDocs(paperData);
  console.log('Formatted for Google Docs:', formatted);
  
  try {
    // Copy as both HTML (for rich text) and plain text (fallback)
    const blob = new Blob([formatted.html], { type: 'text/html' });
    const textBlob = new Blob([formatted.text], { type: 'text/plain' });
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      })
    ]);
    
    console.log('Successfully copied to clipboard');
    showSuccess('✓ Copied as linked text!');
  } catch (err) {
    console.error('Clipboard error:', err);
    showError('Failed to copy: ' + err.message);
  }
});

document.getElementById('copyPlainText').addEventListener('click', () => {
  console.log('Plain text button clicked');
  if (!paperData) {
    showError('No paper data available');
    return;
  }
  
  const formatted = formatPlainText(paperData);
  console.log('Formatted as plain text:', formatted);
  navigator.clipboard.writeText(formatted).then(() => {
    console.log('Successfully copied to clipboard');
    showSuccess('✓ Copied as plain text!');
  }).catch(err => {
    console.error('Clipboard error:', err);
    showError('Failed to copy: ' + err.message);
  });
});