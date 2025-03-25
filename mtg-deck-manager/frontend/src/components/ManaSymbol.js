import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * ManaSymbol component for rendering Magic: The Gathering mana symbols
 * using the Mana font from https://github.com/andrewgioia/mana
 * 
 * @param {Object} props
 * @param {string} props.manaCost - The mana cost string in {X} format (e.g. "{2}{W}{U}")
 * @param {string} props.size - Size of the mana symbols (default: "small")
 * @param {boolean} props.inline - Whether to display inline or as a block (default: true)
 * @param {Object} props.sx - Additional styles to apply
 */
function ManaSymbol({ manaCost, size = "small", inline = true, sx = {} }) {
  if (!manaCost) return null;

  // Map of sizes to pixel values
  const sizeMap = {
    small: "16px",
    medium: "24px",
    large: "32px",
  };

  // Convert size prop to actual size
  const fontSize = sizeMap[size] || size;

  // Parse the mana cost string and convert to mana class names
  const symbols = manaCost.match(/\{([^}]+)\}/g) || [];
  
  return (
    <Box 
      component={inline ? "span" : "div"}
      sx={{ 
        display: "inline-flex", 
        alignItems: "center",
        ...sx 
      }}
      className="mana-symbols"
    >
      {symbols.map((symbol, index) => {
        // Extract the symbol from {X} format
        const manaSymbol = symbol.replace(/[{}]/g, '').toLowerCase();
        
        // Handle special cases
        let displaySymbol = manaSymbol;
        
        // For split mana like {W/U}, we need special handling
        if (manaSymbol.includes('/')) {
          const [color1, color2] = manaSymbol.split('/');
          displaySymbol = `${color1}${color2}`;
        }
        
        return (
          <Box
            key={index}
            component="i"
            className={`ms ms-${displaySymbol} ms-cost`}
            sx={{
              fontSize,
              marginRight: "2px",
              display: "inline-block",
            }}
            aria-label={manaSymbol}
          />
        );
      })}
    </Box>
  );
}

export default ManaSymbol;