import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="hero">
      <section className="heroContent">
        <p className="eyebrow">Global commerce, reis edition.</p>

        <h1>
          Shop smarter. <br />
          Discover better.
        </h1>

        <p className="heroText">
          KemalReis is being built as a premium e-commerce experience for
          products, deals, categories and smart recommendations.
        </p>

        <div className="heroActions">
          <Link to="/products" className="primaryButton">
            Explore Products
          </Link>

          <Link to="/categories" className="ghostButton">
            View Categories
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;