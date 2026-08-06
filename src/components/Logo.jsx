import React from 'react';

/**
 * Lugo Stage Logo Component
 * Automatically switches between black and white versions based on background.
 * @param {Object} props
 * @param {string} props.height - Height of the logo (default '32px')
 * @param {boolean} props.isDarkBackground - If true, uses white logo (lugo-blanco). If false, uses black logo (lugo-negro).
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const Logo = ({ height = '32px', isDarkBackground = true, className = '', style = {} }) => {
    // lugonegro (black) for white backgrounds
    // lugoblanco (white) for black backgrounds
    const src = isDarkBackground ? '/logo2blanco.png' : '/logo2.png';
    
    return (
        <img 
            src={src} 
            alt="Lugo Stage" 
            style={{ 
                height, 
                width: 'auto', 
                objectFit: 'contain',
                ...style 
            }} 
            className={className}
        />
    );
};

export default Logo;
