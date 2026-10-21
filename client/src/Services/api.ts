import axios from "axios";
import { clearClientSession } from "../utils/session";
const api = axios.create({baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", timeout: 30000});
api.interceptors.request.use(config=>{
 try {const saved=localStorage.getItem("audiophile-user");const user=saved?JSON.parse(saved):null;if(user?.token && !config.headers.Authorization)config.headers.Authorization="Bearer "+user.token;}catch{localStorage.removeItem("audiophile-user");}
 return config;
});
api.interceptors.response.use(response=>response,error=>{
 if(error.response?.status===401 && error.config?.headers?.Authorization){
   try {const saved=JSON.parse(localStorage.getItem("audiophile-user")||"null");if(saved?.token && error.config.headers.Authorization === "Bearer "+saved.token)clearClientSession();}catch{ /* Ignore an obsolete request from a previous session. */ }
 }
 return Promise.reject(error);
});
export default api;
