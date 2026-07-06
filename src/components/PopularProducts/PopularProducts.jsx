import products from "../../data/products";
import ProductCard from "../ProductCard/ProductCard";
import { useLanguage } from "../../i18n/LanguageContext";
import "./PopularProducts.css";

function PopularProducts() {
  const { t } = useLanguage();

  return (
    <section className="popularProducts">
      <div className="popularProductsHeader">
        <span>{t("popularProducts.tag")}</span>
        <h2>{t("popularProducts.title")}</h2>
        <p>{t("popularProducts.text")}</p>
      </div>

      <div className="popularProductsGrid">
        {products.map((product) => (
          <ProductCard key={product.key} product={product} />
        ))}
      </div>
    </section>
  );
}

export default PopularProducts;