import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import products from "../../data/products";
import { useLanguage } from "../../i18n/LanguageContext";
import "./SearchBar.css";

function SearchBar() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = searchValue.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!query) {
      return [];
    }

    return products
      .map((product) => {
        const categoryTitle = t(`categories.${product.categoryKey}.title`);

        const searchableText = [
          product.title,
          product.categoryKey,
          categoryTitle,
          String(product.price),
        ]
          .join(" ")
          .toLowerCase();

        return {
          ...product,
          categoryTitle,
          searchableText,
        };
      })
      .filter((product) => product.searchableText.includes(query))
      .slice(0, 6);
  }, [query, t]);

  const shouldShowSuggestions = isFocused && suggestions.length > 0;

  function goToSearch(value) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(cleanValue)}`);
    setIsFocused(false);
    setActiveIndex(-1);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToSearch(suggestions[activeIndex].title);
      return;
    }

    goToSearch(searchValue);
  }

  function handleSuggestionClick(productTitle) {
    setSearchValue(productTitle);
    goToSearch(productTitle);
  }

  function handleKeyDown(event) {
    if (!shouldShowSuggestions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1
      );
    }

    if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="searchBarWrap">
      <form className="searchBar" onSubmit={handleSubmit}>
        <Search size={20} />

        <input
          type="search"
          value={searchValue}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          spellCheck="false"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setActiveIndex(-1);
            }, 120);
          }}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />

        <button type="submit">{t("search.button")}</button>
      </form>

      {shouldShowSuggestions && (
        <div className="searchSuggestions">
          {suggestions.map((product, index) => (
            <button
              type="button"
              key={product.key}
              className={
                index === activeIndex
                  ? "searchSuggestion active"
                  : "searchSuggestion"
              }
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSuggestionClick(product.title)}
            >
              <span className="suggestionIcon">{product.image}</span>

              <span className="suggestionContent">
                <strong>{product.title}</strong>
                <small>{product.categoryTitle}</small>
              </span>

              <span className="suggestionPrice">${product.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;