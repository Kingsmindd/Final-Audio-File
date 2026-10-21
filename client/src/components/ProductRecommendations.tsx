import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight, FiShoppingBag } from "react-icons/fi";
import type { Product } from "../types";
import { useStore } from "../context/StoreContext";
import toast from "react-hot-toast";
import "./ProductRecommendations.css";

export default function ProductRecommendations({products,category}:{products:Product[];category:Product["category"]}) {
  const {addToCart,cartLoading,cartSaving}=useStore();
  if (!products.length) return null;
  return (
    <section className="recommendations" aria-labelledby="recommendations-title">
      <div className="recommendations-heading">
        <div>
          <span className="eyebrow copper-text">The next track in your collection</span>
          <h2 id="recommendations-title">You might like these, too<span>.</span></h2>
          <p>A few more ways to fall in love with your music.</p>
        </div>
        <Link className="recommendations-browse" to={"/"+category}>Explore {category}<FiArrowUpRight aria-hidden="true"/></Link>
      </div>
      <div className="recommendations-grid" tabIndex={0} aria-label="Recommended products. Swipe to browse on mobile.">
        {products.map((product,index)=>(
          <article className="recommendation-card" key={product._id}>
            <Link className="recommendation-image" to={"/product/"+product._id} aria-label={"View "+product.name}>
              <div className="recommendation-image-top"><span className="recommendation-number">0{index+1}</span>{product.isNewArrival&&<span className="recommendation-badge">New arrival</span>}</div>
              <img src={product.image.trim()} alt={product.name} loading="lazy" draggable={false}/>
              <span className="recommendation-image-arrow" aria-hidden="true"><FiArrowUpRight/></span>
            </Link>
            <div className="recommendation-content">
              <span className="recommendation-category">{product.category}</span>
              <h3><Link to={"/product/"+product._id}>{product.name}</Link></h3>
              <p className="recommendation-description">{product.description}</p>
              <div className="recommendation-price"><span>Your next great listen</span><strong>₦ {product.price.toLocaleString("en-NG",{maximumFractionDigits:2})}</strong></div>
              <div className="recommendation-actions">
                <Link to={"/product/"+product._id}>Discover product<FiArrowRight aria-hidden="true"/></Link>
                <button type="button" aria-label={"Add "+product.name+" to your bag"} title="Add to bag" disabled={cartLoading||cartSaving} onClick={async()=>{if(await addToCart(product,1))toast.success(product.name+" added to your bag");}}><FiShoppingBag aria-hidden="true"/></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="recommendations-swipe">Swipe to find your next favourite <FiArrowRight aria-hidden="true"/></p>
    </section>
  );
}
