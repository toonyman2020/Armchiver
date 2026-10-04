with open('src/App.tsx', 'r') as f:
    content = f.read()

install_btn = """
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 mb-2 shadow-sm"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>Install App</span>
                  </button>
                )}
"""

content = content.replace(
    '<nav className="flex-1 space-y-2">',
    '<nav className="flex-1 space-y-2">' + install_btn
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
