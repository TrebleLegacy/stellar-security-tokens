import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
    value: string;
    size?: number;
    bgColor?: string;
    fgColor?: string;
    className?: string;
}

/**
 * QR Code component using the qrcode library
 * Renders a canvas-based QR code for the given value
 */
export function QRCode({
    value,
    size = 180,
    bgColor = '#ffffff',
    fgColor = '#000000',
    className = ''
}: QRCodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !value) return;

        QRCodeLib.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
                dark: fgColor,
                light: bgColor,
            },
            errorCorrectionLevel: 'M',
        }, (err) => {
            if (err) {
                console.error('QR Code generation failed:', err);
                setError('Failed to generate QR code');
            } else {
                setError(null);
            }
        });
    }, [value, size, bgColor, fgColor]);

    if (error) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}
                style={{ width: size, height: size }}
            >
                <p className="text-xs text-gray-500 text-center px-2">QR unavailable</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-3 rounded-xl inline-block ${className}`}>
            <canvas
                ref={canvasRef}
                className="rounded-lg"
                style={{ display: 'block' }}
            />
        </div>
    );
}
