import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./CartToast.css";

function CartToast() {
  const { lastAddedItem, closeCartToast } = useCart();
  const { t } = useLanguage();

  if (!lastAddedItem) {
    return null;
  }

  return (
    <div className="cartToast" role="status" aria-live="polite">
      <div className="cartToastIcon">{lastAddedItem.image}</div>

      <div className="cartToastContent">
        <span>{t("cartToast.added")}</span>
        <strong>{lastAddedItem.title}</strong>
      </div>

      <Link className="cartToastLink" to="/cart" onClick={closeCartToast}>
        {t("cartToast.viewCart")}
      </Link>

      <button
        type="button"
        className="cartToastClose"
        onClick={closeCartToast}
        aria-label={t("cartToast.close")}
      >
        ×
      </button>
    </div>
  );
}

export default CartToast;