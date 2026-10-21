import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import { useStore } from "../context/StoreContext";
import Collections from "../components/Collections";
import ProductRecommendations from "../components/ProductRecommendations";
import Man from "../components/Man";
import RollerLoader from "../components/RollerLoader";
import toast from "react-hot-toast";
export default function ProductDetailsPage(){
 const {id}=useParams();const {products,loading,error,retryProducts,addToCart,cartLoading,cartSaving}=useStore();const [quantity,setQuantity]=useState(1);useEffect(()=>setQuantity(1),[id]);
 if(loading)return <RollerLoader/>;
 if(error)return <div className="shell empty-state"><h1>Let’s try that again.</h1><p>{error}</p><button onClick={retryProducts} className="button button-dark">Reload collection</button></div>;
 const p=products.find(p=>p._id===id);if(!p)return <div className="shell empty-state"><h1>That sound isn’t here.</h1><p>This product may no longer be available.</p><Link to="/headphones" className="button button-dark">Explore headphones</Link></div>;
 const related=products.filter(i=>i._id!==p._id).sort((a,b)=>Number(b.category===p.category)-Number(a.category===p.category)).slice(0,3);
 return <div className="detail-page"><div className="shell"><Link to={"/"+p.category} className="back-link"><FiArrowLeft/> Back to {p.category}</Link><section className="detail-main"><div className="detail-image"><img src={p.image.trim()} alt={p.name} fetchPriority="high"/></div><div className="detail-copy"><span className="eyebrow copper-text">{p.isNewArrival?"New to the collection":p.category}</span><h1>{p.name}</h1><p>{p.description}</p><strong className="detail-price">₦ {p.price.toLocaleString()}</strong><div className="detail-actions"><div className="quantity-control"><button aria-label="Decrease quantity" disabled={quantity<=1} onClick={()=>setQuantity(q=>Math.max(1,q-1))}><FiMinus/></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={()=>setQuantity(q=>q+1)}><FiPlus/></button></div><button className="button button-copper" disabled={cartLoading||cartSaving} onClick={async()=>{if(await addToCart(p,quantity)){toast.success(p.name+" added to your bag");setQuantity(1);}}}>Add to bag <FiArrowRight/></button></div><span className="detail-assurance"><FiCheck/> A little closer to your favourite music.</span></div></section><section className="detail-info"><div><span className="eyebrow copper-text">Behind the sound</span><h2>It’s all in the details.</h2>{p.features.split(/\n\n+/).filter(Boolean).map((text,i)=><p key={i}>{text}</p>)}</div><div className="box-contents"><span className="eyebrow copper-text">Ready to listen</span><h2>In the box.</h2>{p.inTheBox.map((item,i)=><div key={i}><strong>{item.quantity}×</strong><span>{item.item}</span></div>)}</div></section>{p.gallery.length>0&&<section className="detail-gallery" aria-label="Product gallery">{p.gallery.map((url,i)=><img src={url.trim()} alt={p.name+" — detail "+(i+1)} key={i} loading="lazy"/>)}</section>}<ProductRecommendations products={related} category={p.category}/><section className="section-space"><Collections/></section></div><Man/></div>;
}
