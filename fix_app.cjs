const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const highlightFunc = `export async function generateHighlightedFeatureImage(file: File, boundingBox: [number, number, number, number]): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("No 2d context");
            
            ctx.drawImage(img, 0, 0);
            
            const [ymin, xmin, ymax, xmax] = boundingBox;
            const sx = xmin * img.width;
            const sy = ymin * img.height;
            const sw = (xmax - xmin) * img.width;
            const sh = (ymax - ymin) * img.height;
            
            const cx = sx + sw / 2;
            const cy = sy + sh / 2;
            const radius = Math.max(sw, sh) / 1.5;
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.lineWidth = Math.max(3, img.width / 150);
            ctx.strokeStyle = "#ef4444"; // red-500
            ctx.stroke();
            
            // Outer glow for visibility
            ctx.lineWidth = Math.max(1, img.width / 300);
            ctx.strokeStyle = "white";
            ctx.stroke();
            
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject("Image load error");
    });
}
`;

if (!content.includes('generateHighlightedFeatureImage')) {
    content = content.replace(/export async function generateFeatureCrop/g, highlightFunc + '\nexport async function generateFeatureCrop');
    fs.writeFileSync('src/App.tsx', content);
}
