// src/components/CartIcon.tsx
import { useCart } from "../pages/CartContext"; // Ensure this path is correct
import { FaShoppingCart } from "react-icons/fa";
import { Link } from "react-router-dom";

const CartIcon = () => {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link to="/cart" className="nav-link position-relative px-2" title="View Cart"> {/* Added nav-link for styling and padding */}
      <FaShoppingCart size={20} /> {/* Adjusted size slightly for navbar context */}
      {totalItems > 0 && ( // Only show badge if there are items
        <span 
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          style={{ fontSize: '0.65em', padding: '0.3em 0.5em' }} // Slightly smaller badge
        >
          {totalItems}
          <span className="visually-hidden">items in cart</span>
        </span>
      )}
    </Link>
  );
};

export default CartIcon;