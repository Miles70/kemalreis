import { Link, Outlet } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

function MainLayout() {
  return (
    <div className="app">
      <header className="siteHeader">
        <Link to="/" className="logo">
          KemalReis
        </Link>

        <nav className="navLinks">
          <Link to="/categories">Categories</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
        </nav>

        <Link to="/cart" className="cartButton">
          <ShoppingBag size={18} />
          Cart
        </Link>
      </header>

      <Outlet />
    </div>
  );
}

export default MainLayout;