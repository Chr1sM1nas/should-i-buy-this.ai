import React from 'react';
import { ProductData } from '../types';
import './Alternatives.css';

interface AlternativesProps {
  alternatives?: ProductData[];
}

export default function Alternatives({ alternatives }: AlternativesProps) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <div className="alternatives">
      <h3>Better Alternatives</h3>
      <div className="alternatives-list">
        {alternatives.map((product, index) => (
          <div key={index} className="alternative-item">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.title} className="alt-image" />
            )}
            <div className="alt-details">
              <h4>{product.title}</h4>
              <p className="alt-price">${product.price.toFixed(2)}</p>
              {product.rating && (
                <p className="alt-rating">⭐ {product.rating.toFixed(1)}</p>
              )}
              <a href={product.url} target="_blank" rel="noopener noreferrer" className="alt-link">
                View Product →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}