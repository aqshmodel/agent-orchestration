

import { Artifact } from "../types";

declare const marked: any;

// Helper to strip HTML tags for text/markdown export
export const stripHtml = (html: string): string => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Basic extraction - this is a simple approach. 
    // For better results, we might want to replace <br> with \n, <li> with - , etc.
    
    // Replace block elements with newlines to preserve structure
    const blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br', 'tr'];
    blockElements.forEach(tag => {
        const elements = tempDiv.getElementsByTagName(tag);
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (tag === 'br') {
                 el.parentNode?.replaceChild(document.createTextNode('\n'), el);
            } else {
                 // Add newline after block elements
                 const newline = document.createTextNode('\n');
                 el.parentNode?.insertBefore(newline, el.nextSibling);
            }
        }
    });

    return tempDiv.textContent || tempDiv.innerText || "";
};

// Helper to convert HTML structure to Markdown-like text
export const htmlToMarkdown = (html: string): string => {
    let text = html;
    
    // Remove head, script, style
    text = text.replace(/<head>[\s\S]*?<\/head>/gi, '');
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Headings
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    
    // Lists
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<ul[^>]*>/gi, '\n');
    text = text.replace(/<\/ul>/gi, '\n');
    
    // Paragraphs and Breaks
    text = text.replace(/<p[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Bold/Italic
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    
    // Links
    text = text.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Remove remaining tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Fix multiple newlines
    text = text.replace(/\n\s*\n/g, '\n\n');
    
    // Decode entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value.trim();
};

export const generateHtmlReport = (markdownContent: string, title: string = 'A.G.I.S. Strategic Report', language: 'ja' | 'en' = 'ja', artifacts?: Record<string, Artifact>): string => {
  // If content is already a full HTML document, return it as is (maybe with artifact injection)
  if (markdownContent.trim().startsWith('<!DOCTYPE html>') || markdownContent.trim().startsWith('<html')) {
      let processedHtml = markdownContent;
      if (artifacts) {
          processedHtml = processedHtml.replace(/<GENERATE_IMAGE\s+PROMPT="([^"]+)"[^>]*\/>/g, (match, prompt) => {
             const foundArtifact = Object.values(artifacts).find(art => art.description.includes(prompt.substring(0, 20)));
             if (foundArtifact && foundArtifact.type === 'image') {
                 return `<img src="data:${foundArtifact.mimeType};base64,${foundArtifact.data}" alt="${prompt}" class="generated-image" />`;
             }
             return match;
          });
      }
      return processedHtml;
  }

  const locale = language === 'en' ? 'en-US' : 'ja-JP';
  const date = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const tocTitle = language === 'en' ? 'Table of Contents' : '目次';

  // Process artifacts: Replace <FIGURE> tags with actual images or placeholders
  let processedContent = markdownContent;
  
  if (artifacts) {
      processedContent = processedContent.replace(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/g, (match, id, desc) => {
          const artifact = artifacts[id];
          if (artifact && artifact.type === 'image') {
              // Inject base64 image directly into HTML
              return `
<div class="my-8 text-center">
    <img src="data:${artifact.mimeType};base64,${artifact.data}" alt="${desc}" class="max-w-full mx-auto rounded shadow-lg border border-gray-200 dark:border-gray-700" />
    <p class="text-sm text-gray-500 mt-2 italic">${desc}</p>
</div>
              `;
          }
          return `<div class="p-4 bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-400 rounded text-center text-gray-500">[Missing Artifact: ${desc}]</div>`;
      });
  }
  
  // HTML Template
  return `<!DOCTYPE html>
<html lang="${language}" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - A.G.I.S.</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Tailwind Typography Plugin Config -->
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              cyan: { 400: '#22d3ee', 500: '#06b6d4', 900: '#164e63' },
              slate: { 800: '#1e293b', 900: '#0f172a' }
            },
            typography: (theme) => ({
              DEFAULT: {
                css: {
                  maxWidth: 'none',
                  color: theme('colors.gray.800'),
                  lineHeight: '1.8',
                  p: { marginBottom: '1.5em' },
                  h1: { color: theme('colors.slate.900'), fontWeight: '800', marginTop: '0' },
                  h2: { 
                      color: theme('colors.slate.800'), 
                      borderBottom: '2px solid #cbd5e1', 
                      paddingBottom: '0.5rem', 
                      marginTop: '2.5em', 
                      marginBottom: '1em' 
                  },
                  h3: { color: theme('colors.slate.800'), marginTop: '2em', marginBottom: '0.8em' },
                  'code::before': { content: '""' },
                  'code::after': { content: '""' },
                  code: { 
                      backgroundColor: '#f1f5f9', 
                      padding: '0.25rem 0.4rem', 
                      borderRadius: '0.25rem', 
                      fontWeight: '600',
                      color: '#0f172a'
                  },
                  pre: { backgroundColor: '#1e293b', color: '#e2e8f0', padding: '1.5rem', borderRadius: '0.5rem' },
                  li: { marginTop: '0.5em', marginBottom: '0.5em' },
                },
              },
              dark: {
                css: {
                  color: theme('colors.gray.300'),
                  h1: { color: theme('colors.white') },
                  h2: { color: theme('colors.white'), borderBottomColor: '#334155' },
                  h3: { color: theme('colors.gray.200') },
                  strong: { color: theme('colors.white') },
                  code: { backgroundColor: '#334155', color: '#e2e8f0' },
                  a: { color: theme('colors.cyan.400') },
                  blockquote: { color: theme('colors.gray.400'), borderLeftColor: theme('colors.gray.700') },
                },
              },
            }),
          },
        },
      }
    </script>
    <!-- Marked.js for Markdown Parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- Mermaid.js for Diagrams -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; }
        @media print {
            .no-print { display: none !important; }
            body { color: black !important; background: white !important; }
            .prose { max-width: 100% !important; }
            #toc-sidebar { display: none; }
            #main-content { width: 100% !important; margin: 0 !important; padding: 0 !important; }
            header { display: none !important; }
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: #94a3b8; border-radius: 20px; }
        .dark ::-webkit-scrollbar-thumb { background-color: #475569; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">

    <!-- Header -->
    <header class="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6 no-print shadow-sm">
        <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold rounded-lg w-10 h-10 flex items-center justify-center text-xl shadow-md">A</div>
            <div>
                <h1 class="font-bold text-lg leading-tight tracking-wide">A.G.I.S. Report</h1>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Generative Intelligence System</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="window.print()" class="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Print / Save as PDF">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
            </button>
            <button id="theme-toggle" class="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-slate-700 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors" title="Toggle Theme">
                <!-- Sun Icon -->
                <svg class="dark:hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <!-- Moon Icon -->
                <svg class="hidden dark:block" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </button>
        </div>
    </header>

    <!-- Hidden Raw Markdown -->
    <div id="raw-markdown" style="display: none;">${processedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

    <div class="flex pt-16 min-h-screen">
        <!-- Sidebar TOC -->
        <aside id="toc-sidebar" class="w-72 fixed top-16 bottom-0 overflow-y-auto hidden xl:block p-8 border-r border-gray-200 dark:border-gray-800 no-print bg-white dark:bg-slate-950">
            <h3 class="font-bold text-xs text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-widest">${tocTitle}</h3>
            <nav id="toc" class="text-sm space-y-2 text-gray-600 dark:text-gray-400"></nav>
        </aside>

        <!-- Main Content -->
        <main id="main-content" class="flex-1 xl:ml-72 p-6 md:p-16 max-w-4xl mx-auto w-full">
            <div class="mb-16 text-center border-b border-gray-200 dark:border-gray-800 pb-10">
                <span class="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-6 inline-block tracking-wide">STRATEGIC REPORT</span>
                <h1 class="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 leading-tight">${title}</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm font-medium">Generated on ${date}</p>
            </div>

            <!-- Rendered Content -->
            <article id="content-area" class="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <!-- Content injected via JS -->
                <div class="flex justify-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            </article>
            
            <footer class="mt-24 pt-10 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                <p class="font-semibold text-slate-500 dark:text-slate-500">&copy; ${new Date().getFullYear()} A.G.I.S. - AI Generative Intelligence System</p>
                <p class="mt-2 opacity-70">Confidential - Internal Use Only</p>
            </footer>
        </main>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Initialize Theme
            const themeToggleBtn = document.getElementById('theme-toggle');
            const htmlEl = document.documentElement;
            
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                htmlEl.classList.add('dark');
            }

            themeToggleBtn.addEventListener('click', () => {
                htmlEl.classList.toggle('dark');
            });

            // 2. Parse Markdown
            const rawMarkdown = document.getElementById('raw-markdown').innerText;
            const contentArea = document.getElementById('content-area');
            
            // Configure marked
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
            });

            // Custom renderer to handle specific elements if needed
            const renderer = new marked.Renderer();
            
            // Custom Code Block Renderer for Mermaid and Execution Results
            renderer.code = function(code, language) {
                const validCode = String(code || ''); // Ensure code is a string to prevent errors
                
                if (language === 'mermaid') {
                    return '<div class="mermaid my-12 flex justify-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">' + validCode + '</div>';
                }
                // Handle execution results specially
                if (validCode.includes('[Execution Result:')) {
                     return '<div class="my-6 text-xs font-mono bg-slate-900 text-green-400 p-5 rounded-lg border-l-4 border-green-500 overflow-x-auto shadow-lg">' + validCode + '</div>';
                }
                return '<pre class="bg-slate-900 text-slate-200 p-5 rounded-lg overflow-x-auto text-sm shadow-md"><code class="language-' + language + '">' + validCode + '</code></pre>';
            };

            // Parse
            try {
                contentArea.innerHTML = marked.parse(rawMarkdown, { renderer: renderer });
            } catch (e) {
                console.error("Markdown parsing error:", e);
                contentArea.innerHTML = "<p style='color:red;'>Error parsing report content.</p>";
            }

            // 3. Initialize Mermaid
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ 
                    startOnLoad: true,
                    theme: htmlEl.classList.contains('dark') ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'Noto Sans JP',
                });
            }

            // 4. Generate TOC
            const tocContainer = document.getElementById('toc');
            const headings = contentArea.querySelectorAll('h1, h2, h3');
            
            if (headings.length > 0) {
                headings.forEach((heading, index) => {
                    // Skip the title h1 if it's redundant
                    if(index === 0 && heading.tagName === 'H1') return;
                    
                    const id = 'heading-' + index;
                    heading.id = id;
                    
                    const link = document.createElement('a');
                    link.href = '#' + id;
                    link.textContent = heading.textContent;
                    link.className = 'block py-1.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors truncate';
                    
                    if (heading.tagName === 'H3') {
                        link.classList.add('ml-4', 'text-xs', 'border-l', 'border-gray-200', 'dark:border-gray-800', 'pl-3');
                    } else {
                        link.classList.add('font-semibold', 'text-slate-700', 'dark:text-slate-300');
                    }
                    
                    tocContainer.appendChild(link);
                });
            } else {
                document.getElementById('toc-sidebar').style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
};

export const generateWordDoc = (content: string, title: string = 'A.G.I.S. Report', language: 'ja' | 'en' = 'ja'): string => {
    const isHtml = content.trim().startsWith('<!DOCTYPE html>') || content.trim().startsWith('<html');
    let bodyContent = isHtml ? htmlToMarkdown(content) : content;

    const locale = language === 'en' ? 'en-US' : 'ja-JP';
    const dateStr = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    if (typeof marked !== 'undefined') {
        // Custom renderer for Word compatibility
        const renderer = new marked.Renderer();
        
        // Handle Code Blocks (especially Mermaid) to be text-safe for Word
        renderer.code = (code: string, language: string) => {
            const validCode = String(code || ''); // Ensure code is string
            
            if (language === 'mermaid') {
                return `<div style="margin: 1em 0; padding: 1em; background-color: #f8f9fa; border: 1px solid #e9ecef; color: #555;">
                    <p style="font-weight: bold; color: #666; font-family: sans-serif; font-size: 0.9em;">[図表: このMermaid図はWebレポート(.html)でのみ表示可能です]</p>
                    <pre style="font-family: monospace; font-size: 0.8em; white-space: pre-wrap; background-color: #eee; padding: 5px;">${validCode}</pre>
                </div>`;
            }
            return `<pre style="background-color: #f1f1f1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"><code>${validCode}</code></pre>`;
        };

        // Simplify headings styles inline
        renderer.heading = (text: string, level: number) => {
            const styles = [
                'font-size: 24pt; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 30px;',
                'font-size: 18pt; color: #34495e; margin-top: 25px; border-left: 5px solid #3498db; padding-left: 10px;',
                'font-size: 14pt; color: #2c3e50; margin-top: 20px;',
                'font-size: 12pt; font-weight: bold; margin-top: 15px;',
                'font-size: 11pt; font-weight: bold; margin-top: 15px;',
                'font-size: 10pt; font-weight: bold; margin-top: 15px;'
            ];
            const style = styles[level - 1] || styles[5];
            return `<h${level} style="${style}">${text}</h${level}>`;
        };

        // Parse
        try {
            bodyContent = marked.parse(bodyContent, { renderer });
        } catch (e) {
             bodyContent = `<pre>${bodyContent}</pre>`;
        }
    } else {
        // Fallback: Wrap in pre if marked is missing
        bodyContent = `<pre>${bodyContent}</pre>`;
    }
    
    // Simple replace for Artifact Tags in Word (Placeholder only as we can't inject base64 blobs easily into simple HTML-Word export)
    bodyContent = bodyContent.replace(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/g, (match, id, desc) => {
        return `<div style="padding: 10px; border: 1px dashed #999; background: #f0f0f0; text-align: center; margin: 10px 0;">[図表: ${desc}] (Webレポートで確認してください)</div>`;
    });

    // Construct the full Word-compatible MHTML/HTML document
    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <!-- Word specific styles -->
        <style>
            /* Font Definitions */
            @font-face {
                font-family: "Yu Gothic";
                panose-1: 2 11 4 0 0 0 0 0 0 0;
            }
            @font-face {
                font-family: "Meiryo";
            }
            
            /* Basic Reset & Body */
            body {
                font-family: 'Yu Gothic', 'Meiryo', sans-serif;
                line-height: 1.6;
                color: #333;
                font-size: 10.5pt;
            }
            
            /* Headings handled by renderer, but fallback here */
            h1, h2, h3, h4, h5, h6 {
                font-family: 'Meiryo', sans-serif;
                mso-paper-source: 0;
            }

            /* Lists */
            ul, ol { margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }

            /* Tables */
            table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 20px;
                mso-table-layout-alt: fixed;
            }
            th {
                background-color: #f2f2f2;
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-weight: bold;
            }
            td {
                border: 1px solid #ddd;
                padding: 8px;
            }

            /* Quotes */
            blockquote {
                border-left: 4px solid #ccc;
                margin-left: 0;
                padding-left: 15px;
                color: #666;
                font-style: italic;
            }
            
            /* Images */
            img {
                max-width: 100%;
                height: auto;
            }
            
            /* Links */
            a { color: #3498db; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div style="text-align: center; margin-bottom: 40px;">
            <p style="font-size: 28pt; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">${title}</p>
            <p style="color: #666; font-size: 10pt;">Generated by A.G.I.S. on ${dateStr}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        </div>
        ${bodyContent}
    </body>
    </html>`;
};
