with open('src/App.tsx', 'r') as f:
    content = f.read()

open_in_new_tab = """
                {typeof window !== "undefined" && window.self !== window.top && (
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20 mb-2 shadow-sm"
                  >
                    <ExternalLink className="w-5 h-5 shrink-0" />
                    <span>Open in New Tab (To Install)</span>
                  </a>
                )}
"""

content = content.replace(
    '{deferredPrompt && (',
    open_in_new_tab + '{deferredPrompt && ('
)

# need to import ExternalLink
if 'ExternalLink' not in content:
    content = content.replace('Download,', 'Download, ExternalLink,')

with open('src/App.tsx', 'w') as f:
    f.write(content)
