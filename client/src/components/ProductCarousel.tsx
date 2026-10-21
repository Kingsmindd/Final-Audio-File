import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useStore } from "../context/StoreContext";
import { productsInCategory } from "../utils/catalog";
const filters = [{key:"all",label:"All audio"},{key:"headphones",label:"Headphones"},{key:"speakers",label:"Speakers"},{key:"earphones",label:"Earphones"}];
export default function ProductCarousel({initialCategory="all"}:{initialCategory?:string}) {
 const {products,loading,error,retryProducts}=useStore();
 const [category,setCategory]=useState(initialCategory);
 const [ends,setEnds]=useState({start:true,end:true});
 const rail=useRef<HTMLDivElement>(null);
 const gesture=useRef({active:false,moved:false,x:0,scroll:0});
 const titleId=useId();const railId=useId();
 const visible=category==="all"?products:productsInCategory(products,category);
 useEffect(()=>setCategory(initialCategory),[initialCategory]);
 useEffect(()=>{
   const node=rail.current;if(!node)return;
   node.scrollLeft=0;
   const update=()=>setEnds({start:node.scrollLeft<=2,end:node.scrollLeft+node.clientWidth>=node.scrollWidth-2});
   update();node.addEventListener("scroll",update,{passive:true});const observer=new ResizeObserver(update);observer.observe(node);
   return()=>{node.removeEventListener("scroll",update);observer.disconnect();};
 },[category,visible.length]);
 const scroll=(direction:number)=>{const node=rail.current;if(!node)return;const card=node.firstElementChild;const distance=card?card.getBoundingClientRect().width+20:node.clientWidth;node.scrollBy({left:direction*distance,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});};
 return <section className="product-explorer" aria-labelledby={titleId}><div className="explorer-heading"><div><span className="eyebrow copper-text">There’s more to discover</span><h2 id={titleId}>Keep exploring.</h2><p>Find your next favourite. Swipe to see more.</p></div><div className="carousel-arrows"><button type="button" onClick={()=>scroll(-1)} disabled={ends.start} aria-label="Previous products" aria-controls={railId}><FiArrowLeft/></button><button type="button" onClick={()=>scroll(1)} disabled={ends.end} aria-label="Next products" aria-controls={railId}><FiArrowRight/></button></div></div><div className="explorer-filters" role="group" aria-label="Filter products by category">{filters.map(f=><button key={f.key} type="button" aria-pressed={category===f.key} onClick={()=>setCategory(f.key)}>{f.label}<span>{f.key==="all"?products.length:productsInCategory(products,f.key).length}</span></button>)}</div>{error?<div className="product-error-banner" role="alert"><span>{error}</span><button onClick={retryProducts}>Try again</button></div>:loading&&!products.length?<p className="explorer-empty" role="status">Loading the collection…</p>:!visible.length?<p className="explorer-empty">No products in this collection yet. Try another category.</p>:null}<div className="product-rail" id={railId} ref={rail} tabIndex={0} aria-label="Swipeable product collection" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();scroll(e.key==="ArrowRight"?1:-1);}}} onPointerDown={e=>{if(e.pointerType!=="mouse"||e.button!==0)return;gesture.current={active:true,moved:false,x:e.clientX,scroll:e.currentTarget.scrollLeft};}} onPointerMove={e=>{const g=gesture.current;if(!g.active)return;const delta=e.clientX-g.x;if(!g.moved&&Math.abs(delta)>6){g.moved=true;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.classList.add("is-dragging");}if(g.moved){e.preventDefault();e.currentTarget.scrollLeft=g.scroll-delta;}}} onPointerUp={e=>{gesture.current.active=false;e.currentTarget.classList.remove("is-dragging");}} onPointerCancel={e=>{gesture.current.active=false;e.currentTarget.classList.remove("is-dragging");}} onPointerLeave={()=>{if(!gesture.current.moved)gesture.current.active=false;}} onClickCapture={e=>{if(gesture.current.moved){e.preventDefault();e.stopPropagation();gesture.current.moved=false;}}}>{visible.map(product=><Link className="explorer-product" to={"/product/"+product._id} key={product._id} draggable={false}><div className="explorer-image">{product.isNewArrival&&<span className="explorer-badge">New arrival</span>}<img src={product.image.trim()} alt={product.name} loading="lazy" draggable={false}/><span className="explorer-open" aria-hidden="true">↗</span></div><span className="explorer-category">{product.category}</span><h3>{product.name}</h3><div className="explorer-product-bottom"><strong>₦ {product.price.toLocaleString()}</strong><FiArrowRight aria-hidden="true"/></div></Link>)}</div>{visible.length>0&&<div className="explorer-footer"><span>{visible.length} {visible.length===1?"product":"products"} · Swipe, drag, or use the arrows</span>{category!=="all"&&<Link to={"/"+category}>View {category} <FiArrowRight/></Link>}</div>}</section>;
}
