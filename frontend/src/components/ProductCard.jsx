import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Plus } from 'lucide-react';
import { formatPrice, resolveImage } from '../utils/format';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [adding, setAdding] = useState(false);

  if (!product) return null;
  const images = product.images || [];
  const hasVariants = product.variants && product.variants.length > 0;
  const isSale = !!(product.compare_price && product.compare_price > product.price);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product, 1, {});
    setTimeout(() => setAdding(false), 800);
  };

  const handleChoose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.handle}`);
  };

  return (
    <div
      className="product-card"
      data-testid={`product-card-${product.handle}`}
      onMouseEnter={() => images.length > 1 && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
    >
      <Link to={`/products/${product.handle}`} className="product-card-link">
        <div className="product-card-image-wrapper">
          {isSale && <span className="product-badge sale-badge">Sale</span>}
          {images[0] && (
            <img
              src={resolveImage(images[0])}
              alt={product.title}
              className={`product-card-img product-card-img-primary ${imgIdx === 0 ? 'img-visible' : 'img-hidden'}`}
              loading="lazy"
            />
          )}
          {images.length > 1 && (
            <img
              src={resolveImage(images[1])}
              alt={`${product.title} hover`}
              className={`product-card-img product-card-img-secondary ${imgIdx === 1 ? 'img-visible' : 'img-hidden'}`}
              loading="lazy"
            />
          )}
          <div className="product-card-actions">
            {hasVariants ? (
              <button
                className="quick-add-btn choose-btn"
                data-testid={`choose-options-${product.handle}`}
                onClick={handleChoose}
              >
                Choose options
              </button>
            ) : (
              <button
                className={`quick-add-btn ${adding ? 'adding' : ''}`}
                data-testid={`quick-add-${product.handle}`}
                onClick={handleQuickAdd}
              >
                {adding ? 'Added!' : (
                  <>
                    <Plus size={14} />
                    Add
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="product-card-info">
          <h3 className="product-card-title">{product.title}</h3>
          <div className="product-card-price">
            {isSale ? (
              <>
                <span className="price-sale">{formatPrice(product.price)}</span>
                <span className="price-original">{formatPrice(product.compare_price)}</span>
              </>
            ) : (
              <span className="price-regular">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
