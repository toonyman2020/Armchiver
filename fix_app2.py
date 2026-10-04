with open('src/App.tsx', 'r') as f:
    content = f.read()

state_inject = """  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };
"""

content = content.replace(
    '  const [draggingSidebar, setDraggingSidebar] = useState<',
    state_inject + '  const [draggingSidebar, setDraggingSidebar] = useState<'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
