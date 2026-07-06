import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCart } from "../../context/CartContext";
import LanguageSwitcher from "../LanguageSwitcher";
import siteConfig from "../../config/site";
import "./Header.css";

function Header() {
  const { t } = useLanguage();
  const { cartCount } = useCart();

  return (
    <header className="headerWrapper">
      <div className="siteHeader">
        <Link to="/" className="logo">
          {siteConfig.brandName}
        </Link>

        <nav className="navLinks">
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/categories">{t("nav.categories")}</Link>
          <Link to="/products">{t("nav.products")}</Link>
          <Link to="/cart">{t("nav.cart")}</Link>
        </nav>

        <div className="headerActions">
          <Link to="/cart" className="cartButton">
            <ShoppingBag size={18} />
            <span>{t("header.cart")}</span>

            {cartCount > 0 && <strong className="cartCount">{cartCount}</strong>}
          </Link>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Header;