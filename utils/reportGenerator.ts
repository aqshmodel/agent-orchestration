
import { Artifact } from "../types";

declare const marked: any;

// Helper to strip HTML tags for text/markdown export
export const stripHtml = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    let processedHtml = html
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n');

    tempDiv.innerHTML = processedHtml;
    
    const rawText = tempDiv.textContent || tempDiv.innerText || "";
    
    return rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
};

// Helper to convert HTML structure to Markdown-like text
export const htmlToMarkdown = (html: string): string => {
    let text = html;
    
    text = text.replace(/<!DOCTYPE html>/gi, '');
    text = text.replace(/<html>/gi, '');
    text = text.replace(/<\/html>/gi, '');
    text = text.replace(/<body>/gi, '');
    text = text.replace(/<\/body>/gi, '');
    text = text.replace(/<head>[\s\S]*?<\/head>/gi, '');
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n\n');
    text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n\n');
    
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<ul[^>]*>/gi, '\n');
    text = text.replace(/<\/ul>/gi, '\n');
    text = text.replace(/<ol[^>]*>/gi, '\n');
    text = text.replace(/<\/ol>/gi, '\n');
    
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<hr\s*\/?>/gi, '\n---\n');
    
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    text = text.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    text = text.replace(/<img[^>]+alt="([^"]*)"[^>]+src="([^"]+)"[^>]*>/gi, '![ $1 ]( $2 )');

    text = text.replace(/<[^>]+>/g, '');
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;

    return text
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

export const generateHtmlReport = (markdownContent: string, title: string = 'A.G.I.S. Strategic Report', language: 'ja' | 'en' = 'ja', artifacts?: Record<string, Artifact>): string => {
  if (markdownContent.trim().match(/^<!DOCTYPE html>|^<html/i)) {
      let processedHtml = markdownContent;
      if (artifacts) {
          processedHtml = processedHtml.replace(/<GENERATE_IMAGE\s+(?:ID="([^"]+)"\s+)?PROMPT="([^"]+)"[^>]*\/>/g, (match, id, prompt) => {
             let foundArtifact;
             if (id && artifacts[id]) foundArtifact = artifacts[id];
             if (!foundArtifact) foundArtifact = Object.values(artifacts).find(art => art.description.includes(prompt.substring(0, 20)));
             
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

  let processedContent = markdownContent;
  
  if (artifacts) {
      processedContent = processedContent.replace(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/g, (match, id, desc) => {
          const artifact = artifacts[id];
          if (artifact && artifact.type === 'image') {
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
  
  return `<!DOCTYPE html>
<html lang="${language}" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - A.G.I.S.</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
                  h2: { borderBottom: '2px solid #cbd5e1', paddingBottom: '0.5rem', marginTop: '2.5em', marginBottom: '1em' },
                  pre: { backgroundColor: '#1e293b', color: '#e2e8f0', padding: '1.5rem', borderRadius: '0.5rem' },
                },
              },
              dark: {
                css: {
                  color: theme('colors.gray.300'),
                  h1: { color: theme('colors.white') },
                  h2: { color: theme('colors.white'), borderBottomColor: '#334155' },
                },
              },
            }),
          },
        },
      }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; }
        @media print {
            .no-print { display: none !important; }
            body { color: black !important; background: white !important; }
            #toc-sidebar { display: none; }
            header { display: none !important; }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header class="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6 no-print shadow-sm">
        <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold rounded-lg w-10 h-10 flex items-center justify-center text-xl shadow-md">A</div>
            <div>
                <h1 class="font-bold text-lg leading-tight">A.G.I.S. Report</h1>
                <p class="text-[10px] text-gray-500 uppercase tracking-widest">AI Generative Intelligence System</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="window.print()" class="p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200">Print</button>
        </div>
    </header>

    <div id="raw-markdown" style="display: none;">${processedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

    <div class="flex pt-16 min-h-screen">
        <aside id="toc-sidebar" class="w-72 fixed top-16 bottom-0 overflow-y-auto hidden xl:block p-8 border-r border-gray-200 dark:border-gray-800 no-print bg-white dark:bg-slate-950">
            <h3 class="font-bold text-xs text-gray-500 mb-6 uppercase tracking-widest">${tocTitle}</h3>
            <nav id="toc" class="text-sm space-y-2"></nav>
        </aside>

        <main id="main-content" class="flex-1 xl:ml-72 p-6 md:p-16 max-w-4xl mx-auto w-full">
            <div class="mb-16 text-center border-b border-gray-200 dark:border-gray-800 pb-10">
                <h1 class="text-3xl md:text-5xl font-bold mb-6">${title}</h1>
                <p class="text-gray-500 text-sm font-medium">Generated on ${date}</p>
            </div>
            <article id="content-area" class="prose prose-lg prose-slate dark:prose-invert max-w-none"></article>
            <footer class="mt-24 pt-10 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>&copy; ${new Date().getFullYear()} A.G.I.S.</p>
            </footer>
        </main>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const rawMarkdown = document.getElementById('raw-markdown').innerText;
            const contentArea = document.getElementById('content-area');
            
            const renderer = new marked.Renderer();
            renderer.code = function(code, language) {
                if (language === 'mermaid') {
                    return '<div class="mermaid my-12 flex justify-center bg-white p-6 rounded-xl border shadow-sm">' + code + '</div>';
                }
                return '<pre class="bg-slate-900 text-slate-200 p-5 rounded-lg overflow-x-auto text-sm"><code>' + code + '</code></pre>';
            };

            try {
                contentArea.innerHTML = marked.parse(rawMarkdown, { renderer: renderer });
            } catch (e) {
                console.error("Markdown parsing error:", e);
                contentArea.innerHTML = "<p>Error parsing content.</p>";
            }

            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ startOnLoad: true, theme: 'default' });
            }
        });
    </script>
</body>
</html>`;
};

/**
 * Internal helper to extract and sanitize body content for Word generation.
 * Ensures we get the actual content even from full HTML documents.
 */
const extractCleanBodyContent = (content: string): string => {
    const isHtml = content.trim().match(/^<!DOCTYPE html>|^<html/i);
    let bodyContent = "";

    if (!isHtml) {
        // If Markdown, parse to HTML first
        if (typeof marked !== 'undefined') {
            const renderer = new marked.Renderer();
            renderer.image = (href: string, title: string, text: string) => {
                 return `<img src="${href}" alt="${text}" width="500" style="max-width:100%; height:auto;" />`;
            };
            renderer.code = (code: string, lang: string) => {
                if(lang === 'mermaid') return `<div style="padding:10px; border:1px solid #ccc; background:#f9f9f9; color:#666; font-family:monospace;">[Diagram: ${code.substring(0,30)}...] (See Web Report)</div>`;
                return `<pre style="background:#f0f0f0; padding:10px;">${code}</pre>`;
            };
            try {
                bodyContent = marked.parse(content, { renderer });
            } catch (e) {
                bodyContent = `<pre>${content}</pre>`;
            }
        } else {
            bodyContent = `<pre>${content}</pre>`;
        }
    } else {
        // If HTML, use DOMParser to safely extract body content
        // DOMParser is safer than innerHTML injection and handles full docs
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Remove elements that break Word or are unnecessary
        const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, button, iframe, .no-print');
        elementsToRemove.forEach(el => el.remove());
        
        // Try to find the main content container first
        const main = doc.querySelector('main') || doc.querySelector('article') || doc.querySelector('body');
        
        if (main) {
            // Fix images for Word (Base64 needs correct styling or it might be huge)
            main.querySelectorAll('img').forEach(img => {
                img.setAttribute('width', '500');
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            });
            bodyContent = main.innerHTML;
        } else {
            bodyContent = "Error: Could not extract content.";
        }
    }

    // Final regex cleanup for custom tags
    bodyContent = bodyContent.replace(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/g, 
        `<div style="padding: 10px; border: 1px dashed #999; background: #f0f0f0; text-align: center; margin: 10px 0;">[Figure: $2]</div>`
    );
    bodyContent = bodyContent.replace(/<GENERATE_IMAGE\s+(?:ID="([^"]+)"\s+)?PROMPT="([^"]+)"[^>]*\/>/g,
        `<div style="padding: 10px; border: 1px dashed #999; background: #f0f0f0; text-align: center; margin: 10px 0;">[Image: $2]</div>`
    );

    return bodyContent;
};

/**
 * Generates MHTML (MIME HTML) format for .doc extension.
 * This is a fallback method.
 */
export const generateWordDocHtml = (content: string, title: string = 'A.G.I.S. Report', language: 'ja' | 'en' = 'ja'): string => {
    const bodyContent = extractCleanBodyContent(content);
    const locale = language === 'en' ? 'en-US' : 'ja-JP';
    const dateStr = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    // Microsoft Office MHTML structure
    return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: 'Yu Gothic', 'Meiryo', 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; }
        h1 { font-size: 24pt; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 20px; }
        h2 { font-size: 18pt; color: #2c3e50; margin-top: 15px; margin-bottom: 10px; }
        h3 { font-size: 14pt; color: #34495e; margin-top: 10px; font-weight: bold; }
        p { margin-bottom: 10px; text-align: justify; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
        th { background-color: #f2f2f2; border: 1px solid #000; padding: 8px; font-weight: bold; }
        td { border: 1px solid #000; padding: 8px; }
        pre { background-color: #f5f5f5; padding: 10px; border: 1px solid #ccc; font-family: monospace; font-size: 9pt; }
        a { color: #0563c1; text-decoration: underline; }
        @page { size: 21cm 29.7cm; margin: 2.54cm; mso-page-orientation: portrait; }
    </style>
</head>
<body>
    <div class="WordSection1">
        <div style="text-align: center; margin-bottom: 40px;">
            <p style="font-size: 28pt; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">${title}</p>
            <p style="color: #666; font-size: 10pt;">Generated on ${dateStr}</p>
            <hr style="border: 0; border-top: 2px solid #eee; margin: 20px 0;" />
        </div>
        ${bodyContent}
        <br clear="all" style="page-break-before:always" />
        <div style="text-align:center; font-size:9pt; color:#888;">
            <p>A.G.I.S. - AI Generative Intelligence System</p>
        </div>
    </div>
</body>
</html>`;
};

// Compatibility wrapper
export const generateWordDoc = (content: string, title: string = 'A.G.I.S. Report', language: 'ja' | 'en' = 'ja'): string => {
    return generateWordDocHtml(content, title, language);
}

/**
 * Generates a Blob for .docx download.
 * Uses html-docx-js if available for true DOCX, otherwise falls back to MHTML (.doc).
 */
export const generateDocxBlob = (content: string, title: string = 'A.G.I.S. Report', language: 'ja' | 'en' = 'ja'): Blob | null => {
    // 1. Extract pure content without headers/footers/scripts
    const bodyContent = extractCleanBodyContent(content);
    
    // 2. Use html-docx-js if available for true DOCX generation
    if (typeof window.htmlDocx !== 'undefined') {
        // Build a simple, standard HTML specifically for html-docx-js
        // DO NOT include xmlns:o or xmlns:w headers here, as it confuses the parser.
        const standardHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; line-height: 1.5; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #999; padding: 5px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${bodyContent}
</body>
</html>`;

        return window.htmlDocx.asBlob(standardHtml, {
             orientation: 'portrait',
             margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // Twips
        });
    }
    
    // 3. Fallback: Use MHTML format for .doc
    const mhtml = generateWordDocHtml(content, title, language);
    return new Blob([mhtml], { type: 'application/msword;charset=utf-8' });
};
