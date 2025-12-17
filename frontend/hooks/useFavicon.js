import { useEffect, useRef, useCallback } from 'react';

/**
 * useFavicon Hook
 * Manages the browser tab favicon to show status, badges, or alerts.
 * 
 * Usage:
 * const { setFavicon } = useFavicon();
 * setFavicon('loading');
 * setFavicon('badge', 5);
 * setFavicon('error');
 * setFavicon('normal'); // Reset
 */
export const useFavicon = () => {
    const linkRef = useRef(null);
    const canvasRef = useRef(null);
    const originalHref = useRef('/favicon.ico');

    useEffect(() => {
        // 1. Locate or Create Link Tag
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        linkRef.current = link;
        // Store original only if not already stored
        if (link.href && !originalHref.current.includes('data:')) {
            originalHref.current = link.href;
        }

        // 2. Setup Canvas
        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            canvasRef.current = canvas;
        }
    }, []);

    const drawIcon = useCallback((type, value = null) => {
        if (!canvasRef.current || !linkRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        // Base image - ensure this exists in public folder
        img.src = '/logo_intersnack.png';

        // Fallback or Generic Draw if image fails or for immediate feedback
        const drawShapes = () => {
            // Draw Overlays
            if (type === 'loading') {
                // Spinner Ring (Green)
                ctx.beginPath();
                ctx.arc(24, 24, 7, 0, 2 * Math.PI);
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(24, 24, 7, 0, Math.PI);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#22c55e';
                ctx.stroke();
            }
            else if (type === 'error') {
                // Red Error Badge
                ctx.beginPath();
                ctx.arc(24, 24, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Exclamation
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('!', 24, 24); // Approximation
            }
            else if (type === 'badge') {
                // Notification Badge
                const count = value || 1;
                ctx.beginPath();
                ctx.arc(22, 10, 8, 0, 2 * Math.PI);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px sans-serif'; // Use sans-serif for better cross-browser
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(count > 9 ? '9+' : count, 22, 11);
            }

            // Apply to Link Tag
            linkRef.current.href = canvasRef.current.toDataURL('image/png');
        };

        img.onload = () => {
            ctx.clearRect(0, 0, 32, 32);
            ctx.drawImage(img, 2, 2, 28, 28); // Shrink slightly to fit badges
            drawShapes();
        };

        img.onerror = () => {
            // If logo fails, draw a generic initial or background
            ctx.fillStyle = '#ccc';
            ctx.fillRect(0, 0, 32, 32);
            drawShapes();
        };

    }, []);

    const setStatus = (status, payload) => {
        if (status === 'normal' || status === 'idle') {
            if (linkRef.current) linkRef.current.href = originalHref.current;
        } else {
            drawIcon(status, payload);
        }
    };

    return { setFavicon: setStatus };
};

export default useFavicon;
