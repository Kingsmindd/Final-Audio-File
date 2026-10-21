import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useStore } from "../context/StoreContext";
import ProductCard from "./ProductCard";
import ProductCarousel from "./ProductCarousel";
import Man from "./Man";
export default function CategoryPageLayout({title,products}:{title:string;products:Product[]}){
 const {error,retryProducts}=useStore();
 return <div><header className="catalog-header"><div className="shell"><span className="eyebrow copper-text">The collection</span><h1>{title}<span>.</span></h1><p>A little more clarity. A lot more feeling.</p><div className="catalog-meta"><Link to="/">Home</Link><span>/</span><span>{title}</span><span className="catalog-count">{products.length} products</span></div></div></header><section className="shell catalog-list">{error?<div className="empty-state"><h2>We couldn’t load the collection.</h2><p>{error}</p><button className="button button-dark" onClick={retryProducts}>Try again</button></div>:products.length?products.map((p,i)=><ProductCard key={p._id} product={p} reversed={i%2!==0}/>):<div className="empty-state"><h2>A little quiet here.</h2><p>There are no products in this collection yet.</p><Link to="/" className="text-link">Explore the store →</Link></div>}</section><section className="shell section-space"><ProductCarousel initialCategory={title.toLowerCase()}/></section><Man/></div>;
}
