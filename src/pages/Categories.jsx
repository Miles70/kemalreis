import categories from "../data/categories";
import products from "../data/products";
import ProductCard from "../components/ProductCard/ProductCard";
import { useLanguage } from "../i18n/LanguageContext";
import "./Categories.css";

function Categories() {
  const { t } = useLanguage();

  return (
    <main className="categoriesPage">
      <section className="categoriesHero">
        <span>{t("categoriesPage.tag")}</span>
        <h1>{t("categoriesPage.title")}</h1>
        <p>{t("categoriesPage.text")}</p>
      </section>

      <section className="categoryGroups">
        {categories.map((category) => {
          const categoryProducts = products.filter(
            (product) => product.categoryKey === category.key
          );

          return (
            <article className="categoryGroup" key={category.key}>
              <div className="categoryGroupHeader">
                <div className="categoryTitleBox">
                  <div className="categoryIcon">{category.icon}</div>

                  <div>
                    <span>{t(`categories.${category.key}.title`)}</span>
                    <h2>{t(`categories.${category.key}.description`)}</h2>
                  </div>
                </div>

                <p>
                  {categoryProducts.length} {t("categoriesPage.items")}
                </p>
              </div>

              <div className="categoryProductsGrid">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.key} product={product} />
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default Categories;