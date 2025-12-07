import React, { useState } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  magnifierHeight?: number;
  magnifierWidth?: number;
  zoomLevel?: number;
  className?: string;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt = '',
  width = '100%',
  height = 'auto',
  magnifierHeight = 150,
  magnifierWidth = 150,
  zoomLevel = 2.5,
  className = '',
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [xy, setXY] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    setImgSize({ width, height });
    setShowMagnifier(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const elem = e.currentTarget;
    const { top, left } = elem.getBoundingClientRect();

    // Calculate relative position of cursor on image
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;

    setXY({ x, y });
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: width,
        height: height,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <div
        style={{
          display: showMagnifier ? '' : 'none',
          position: 'absolute',
          pointerEvents: 'none',
          height: `${magnifierHeight}px`,
          width: `${magnifierWidth}px`,
          top: `${xy.y - magnifierHeight / 2}px`,
          left: `${xy.x - magnifierWidth / 2}px`,
          opacity: '1',
          border: '1px solid lightgray',
          backgroundColor: 'white',
          backgroundImage: `url('${src}')`,
          backgroundRepeat: 'no-repeat',
          // Calculate zoomed image size
          backgroundSize: `${imgSize.width * zoomLevel}px ${
            imgSize.height * zoomLevel
          }px`,
          // Calculate position of zoomed image
          backgroundPositionX: `${-xy.x * zoomLevel + magnifierWidth / 2}px`,
          backgroundPositionY: `${-xy.y * zoomLevel + magnifierHeight / 2}px`,
          borderRadius: '50%', // Circular magnifier
          boxShadow: '0 0 10px rgba(0,0,0,0.25)',
          zIndex: 50,
        }}
      />
    </div>
  );
};
