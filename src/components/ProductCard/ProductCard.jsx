import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCart } from "../../context/CartContext";
import "./ProductCard.css";

function ProductCard({ product }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  function handleAddToCart() {
    addToCart(product);
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 900);
  }

  return (
    <article className={isAdded ? "productCard added" : "productCard"}>
      <div className="productImage">
        <span>{product.image}</span>
      </div>

      <div className="productContent">
        <p className="productCategory">
          {t(`categories.${product.categoryKey}.title`)}
        </p>

        <h3>{product.title}</h3>

        <div className="productBottom">
          <strong>${product.price}</strong>

          <button
            type="button"
            className={isAdded ? "addButton added" : "addButton"}
            onClick={handleAddToCart}
          >
            {isAdded ? t("productCard.added") : t("productCard.add")}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;