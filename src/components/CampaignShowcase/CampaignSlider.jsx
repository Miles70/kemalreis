import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FALLBACK_INTERVAL = 5500;

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value) || 0);
}

function SlideButton({ slide }) {
  const content = (
    <>
      {slide.buttonLabel}
      <ArrowRight size={18} />
    </>
  );

  if (/^https?:\/\//i.test(slide.buttonUrl || "")) {
    return (
      <a className="campaignShowcaseButton" href={slide.buttonUrl}>
        {content}
      </a>
    );
  }

  return (
    <Link className="campaignShowcaseButton" to={slide.buttonUrl || "/products"}>
      {content}
    </Link>
  );
}

function CampaignSlider({ campaign }) {
  const slides = campaign.slides?.length ? campaign.slides : [campaign];
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const moveTo = useCallback(
    (index, nextDirection = 1) => {
      const normalized = (index + slides.length) % slides.length;
      setDirection(nextDirection);
      setActiveIndex(normalized);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;

    const timer = window.setTimeout(
      () => moveTo(activeIndex + 1, 1),
      Number(campaign.slideIntervalMs) || FALLBACK_INTERVAL,
    );

    return () => window.clearTimeout(timer);
  }, [activeIndex, campaign.slideIntervalMs, moveTo, paused, slides.length]);

  const slide = slides[activeIndex] || slides[0];
  const backgroundStyle = slide.backgroundImageUrl
    ? { backgroundImage: `linear-gradient(105deg, rgba(30,4,34,.97), rgba(102,15,76,.9), rgba(43,20,91,.86)), url(${slide.backgroundImageUrl})` }
    : undefined;

  return (
    <section
      className={`campaignShowcase campaignShowcase--${slide.theme || "signature"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Gabaloo campaigns"
    >
      <div
        className="campaignShowcaseBackdrop"
        key={`background-${slide.id || activeIndex}`}
        style={backgroundStyle}
      />
      <div className="campaignShowcaseGlow campaignShowcaseGlowOne" />
      <div className="campaignShowcaseGlow campaignShowcaseGlowTwo" />

      <div
        className={`campaignShowcaseInner campaignSlideEnter campaignSlideEnter--${direction > 0 ? "next" : "previous"}`}
        key={slide.id || activeIndex}
      >
        <div className="campaignShowcaseContent">
          <p className="campaignShowcaseEyebrow">
            <Sparkles size={16} /> {slide.eyebrow}
          </p>
          <h2>{slide.title}</h2>
          <p className="campaignShowcaseDescription">{slide.description}</p>
          <SlideButton slide={slide} />
        </div>

        <div className="campaignProductRail">
          {(slide.products || []).slice(0, 3).map((product, index) => (
            <Link
              className="campaignProductCard"
              to={`/products/${encodeURIComponent(product.key)}`}
              key={product.key}
              style={{ "--campaign-card-index": index }}
            >
              <div className="campaignProductImage">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} loading="lazy" />
                ) : (
                  <span>{product.image || "🛍️"}</span>
                )}
              </div>
              <div className="campaignProductMeta">
                <strong>{product.title}</strong>
                <div className="campaignProductPrice">
                  <span>{money(product.price, product.currency)}</span>
                  {product.oldPrice ? <del>{money(product.oldPrice, product.currency)}</del> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="campaignCarouselControls">
          <button type="button" onClick={() => moveTo(activeIndex - 1, -1)} aria-label="Previous campaign">
            <ChevronLeft size={20} />
          </button>
          <div className="campaignCarouselDots">
            {slides.map((item, index) => (
              <button
                className={index === activeIndex ? "is-active" : ""}
                type="button"
                onClick={() => moveTo(index, index >= activeIndex ? 1 : -1)}
                aria-label={`Show ${item.title}`}
                key={item.id || index}
              >
                <span />
              </button>
            ))}
          </div>
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => moveTo(activeIndex + 1, 1)} aria-label="Next campaign">
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default CampaignSlider;
