/**
 * Robust Cross-Platform & Iframe-Safe Printing Utility
 * Works seamlessly in sandboxed iframes, popups, and standalone desktop windows.
 */

export function printHtmlViaIframe(htmlContent: string): boolean {
  try {
    // Remove any existing print iframes
    const oldFrame = document.getElementById('__aada_print_frame__');
    if (oldFrame) {
      oldFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = '__aada_print_frame__';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      console.warn('Could not access print iframe document');
      return false;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print trigger error:', err);
      }
      setTimeout(() => {
        try {
          iframe.remove();
        } catch (_) {}
      }, 60000);
    };

    if (iframe.contentWindow) {
      iframe.contentWindow.onload = () => {
        setTimeout(triggerPrint, 300);
      };
      // Fallback timer in case onload doesn't fire
      setTimeout(triggerPrint, 600);
    } else {
      setTimeout(triggerPrint, 500);
    }

    return true;
  } catch (error) {
    console.error('Failed to print via iframe:', error);
    return false;
  }
}

export function executePrintDocument(htmlContent: string): void {
  // 1. Try iframe printing first (most reliable in embedded iframes without popup blockers)
  const iframeSuccess = printHtmlViaIframe(htmlContent);
  if (iframeSuccess) return;

  // 2. Fallback to window.open if iframe fails
  try {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.onload = () => {
        setTimeout(() => {
          printWin.focus();
          printWin.print();
        }, 400);
      };
    }
  } catch (e) {
    console.error('window.open print failed:', e);
  }
}
