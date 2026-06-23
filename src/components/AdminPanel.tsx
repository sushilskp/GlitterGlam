import React, { useState, useEffect } from 'react';
import { Package, Sliders, Check, FolderUp, Plus, Trash2, Save, Star, Video, MessageCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Product, HomeSettings, Review, VideoReview } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  loadReviews, saveReview, deleteReview,
  loadVideoReviews, saveVideoReview, deleteVideoReview
} from '../lib/reviewsStore';

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  settings: HomeSettings;
  onUpdateSettings: (settings: HomeSettings) => void;
  onRestoreDb: (backupJson: string) => boolean;
  onResetDb: () => void;
  syncState?: { status: string; message: string };
  isCloudLoading?: boolean;
}

export default function AdminPanel({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  settings,
  onUpdateSettings,
  onRestoreDb,
  onResetDb,
  syncState = { status: 'disconnected', message: 'No sync status connected.' },
  isCloudLoading = false
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'inventory' | 'social' | 'settings'>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState<HomeSettings>(settings);
  const [newTrust, setNewTrust] = useState<{name: string; logoUrl: string; href?: string}>({ name: '', logoUrl: '', href: '' });
  const [newReview, setNewReview] = useState<{name: string; rating: number; text: string; source?: string}>({ name: '', rating: 5, text: '', source: '' });

  // Reviews & Video-reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [newVideo, setNewVideo] = useState<{ title: string; url: string; productSku: string; thumbnail: string }>({ title: '', url: '', productSku: '', thumbnail: '' });
  const [socialTab, setSocialTab] = useState<'reviews' | 'videos'>('reviews');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoReview | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [r, v] = await Promise.all([loadReviews(), loadVideoReviews()]);
      if (!mounted) return;
      setReviews(r);
      setVideos(v);
    })();
    return () => { mounted = false; };
  }, [activeSubTab]);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    discountPrice: 0,
    category: 'Necklaces',
    type: 'Artificial',
    images: [''],
    description: '',
    material: '',
    plating: '',
    stock: 10,
    sku: '',
    careGuide: '',
    customOrderEnabled: true,
    sizeOptions: ['Free Size']
  });

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Auto-save settings whenever the slideshow images (or any other tracked
  // settings field) change. We save on *any* change — including when the
  // array shrinks to zero — so deletes persist to the cloud. We also bail
  // out when the form is in sync with the latest server snapshot to avoid
  // re-writing on every cloud reload.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const formKey = JSON.stringify({
        gallery: settingsForm.heroGalleryImages || [],
        banner: settingsForm.heroBannerImage || '',
        announcement: settingsForm.announcementText || '',
        headline: settingsForm.heroHeadline || '',
        subtitle: settingsForm.heroSubtitle || '',
        whatsapp: settingsForm.whatsappContact || '',
        address: settingsForm.storeAddress || '',
        timing: settingsForm.storeTiming || '',
        email: settingsForm.supportEmail || '',
        insta: settingsForm.instagramHandle || ''
      });
      const serverKey = JSON.stringify({
        gallery: settings.heroGalleryImages || [],
        banner: settings.heroBannerImage || '',
        announcement: settings.announcementText || '',
        headline: settings.heroHeadline || '',
        subtitle: settings.heroSubtitle || '',
        whatsapp: settings.whatsappContact || '',
        address: settings.storeAddress || '',
        timing: settings.storeTiming || '',
        email: settings.supportEmail || '',
        insta: settings.instagramHandle || ''
      });
      if (formKey !== serverKey) {
        onUpdateSettings(settingsForm);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [settingsForm, settings, onUpdateSettings]);

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setNewProduct(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProduct({
      name: '',
      price: 0,
      discountPrice: 0,
      category: 'Necklaces',
      type: 'Artificial',
      images: [''],
      description: '',
      material: '',
      plating: '',
      stock: 10,
      sku: '',
      careGuide: '',
      customOrderEnabled: true,
      sizeOptions: ['Free Size']
    });
  };

  const handleSettingsSave = () => {
    onUpdateSettings(settingsForm);
    alert('Settings successfully updated!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []) as File[];
    if (files.length === 0) {
      inputEl.value = '';
      return;
    }
    
    // Validate
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`Only JPG, JPEG, PNG, or WEBP images are allowed. Skipped ${file.name}`);
        inputEl.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image size exceeds 10MB maximum limit. Skipped ${file.name}`);
        inputEl.value = '';
        return;
      }
    }

    try {
      const { supabase } = await import('../lib/supabaseClient');
      if (!supabase) throw new Error('Supabase not configured');
      
      alert('Uploading images, please wait...');
      
      const newUrls: string[] = [];

      for (const file of files) {
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        // UUID + timestamp = unique filename, never collides with prior uploads.
        const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
      
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newUrls.push(publicUrlData.publicUrl);
        }
      }

      setNewProduct(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newUrls].filter(img => img && img.trim() !== '')
      }));
      alert('Images uploaded successfully!');
    } catch (error: any) {
      console.error('Upload Error:', error);
      alert('Image upload failed: ' + (error?.message || 'Unknown error') + '\nVerify that a public Supabase Storage bucket named "assets" exists.');
    } finally {
      inputEl.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []) as File[];
    // If the user cancelled the picker, reset the value and exit silently
    if (files.length === 0) {
      inputEl.value = '';
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`Only JPG, JPEG, PNG, or WEBP images are allowed. Skipped ${file.name}`);
        inputEl.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image size exceeds 10MB maximum limit. Skipped ${file.name}`);
        inputEl.value = '';
        return;
      }
    }

    try {
      const { supabase } = await import('../lib/supabaseClient');
      if (!supabase) throw new Error('Supabase not configured');

      const newUrls: string[] = [];
      for (const file of files) {
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        // Use UUID + timestamp to guarantee a unique filename in the bucket,
        // so we never collide with a previous upload.
        const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
        const filePath = `hero-gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newUrls.push(publicUrlData.publicUrl);
        }
      }

      const mergedImages = [...(settingsForm.heroGalleryImages || []), ...newUrls].filter(Boolean);
      const nextSettings = { ...settingsForm, heroGalleryImages: mergedImages };
      setSettingsForm(nextSettings);
      // Push to cloud immediately so refresh + server restart both see it.
      onUpdateSettings(nextSettings);
      if (newUrls.length > 0) {
        alert(`${newUrls.length} gallery photo${newUrls.length > 1 ? 's' : ''} uploaded successfully!`);
      }
    } catch (error: any) {
      console.error('Gallery upload error:', error);
      alert('Gallery upload failed: ' + (error?.message || 'Unknown error') + '\nVerify that a public Supabase Storage bucket named "assets" exists.');
    } finally {
      // Reset the input so the same file can be re-selected later.
      inputEl.value = '';
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;
    
    if (editingId) {
      onEditProduct({ ...(newProduct as Product), id: editingId });
      alert('Product updated successfully!');
    } else {
      const prod: Product = {
        ...(newProduct as Product),
        id: uuidv4()
      };
      onAddProduct(prod);
      alert('Product added successfully!');
    }
    handleCancelEdit();
  };

  const removeImage = (index: number) => {
    if (!newProduct.images) return;
    const newImages = [...newProduct.images];
    newImages.splice(index, 1);
    setNewProduct({ ...newProduct, images: newImages });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-8">
      <div className="w-64 shrink-0 space-y-2 bg-stone-50 p-4 rounded-lg border border-stone-200 h-fit">
        <div className="text-xs font-bold uppercase tracking-widest text-[#C9A66B] mb-4">Nav Menu</div>
        <button onClick={() => setActiveSubTab('dashboard')} className={`block w-full text-left px-4 py-2 rounded text-sm ${activeSubTab === 'dashboard' ? 'bg-[#c9a66b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Dashboard Overview</button>
        <button onClick={() => setActiveSubTab('inventory')} className={`block w-full text-left px-4 py-2 rounded text-sm ${activeSubTab === 'inventory' ? 'bg-[#c9a66b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Product Inventory</button>
        <button onClick={() => setActiveSubTab('social')} className={`block w-full text-left px-4 py-2 rounded text-sm ${activeSubTab === 'social' ? 'bg-[#c9a66b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Reviews & Videos</button>
        <button onClick={() => setActiveSubTab('settings')} className={`block w-full text-left px-4 py-2 rounded text-sm ${activeSubTab === 'settings' ? 'bg-[#c9a66b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Platform Settings</button>
      </div>

      <div className="flex-1 bg-white p-6 md:p-8 shadow-sm rounded-lg border border-stone-100">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900 border-b pb-4">Glitter Glam Back-Office</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Total Products</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">{products.length}</div>
              </div>
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Featured Items</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">{products.filter(p => p.isFeatured).length}</div>
              </div>
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Low Stock Warnings</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">{products.filter(p => p.stock > 0 && p.stock <= 5).length}</div>
              </div>
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Out of Stock</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">{products.filter(p => p.stock <= 0).length}</div>
              </div>
              
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Total Orders</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">{settings.totalOrders || 0}</div>
              </div>
              <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Total Income Generated</div>
                <div className="text-3xl font-bold text-[#C9A66B] mt-2">₹{settings.totalIncome || 0}</div>
              </div>
              
              <div className="sm:col-span-2 bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">Database Status Link</div>
                <div className={`text-sm font-bold mt-2 ${syncState.status === 'synced' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {syncState.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">{syncState.message}</div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'inventory' && (
          <div className="space-y-8">
             <div className="border-b pb-4">
               <h2 className="font-serif text-2xl font-bold text-stone-900">Manage Inventory</h2>
               <p className="text-sm text-gray-500 mt-1">Add new WhatsApp catalogue items or delete existing ones.</p>
             </div>

             <form onSubmit={handleAddSubmit} className="bg-stone-50 p-6 rounded-lg border border-stone-200 space-y-4">
               <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                 <h3 className="font-bold text-sm uppercase tracking-wider text-stone-700 flex items-center gap-2">
                   {editingId ? <Sliders className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                   {editingId ? 'Edit Product' : 'Add New Product'}
                 </h3>
                 {editingId && (
                   <button type="button" onClick={handleCancelEdit} className="text-xs text-stone-500 hover:text-stone-800 underline">
                     Cancel Edit
                   </button>
                 )}
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Product Name</label>
                   <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border p-2 text-sm rounded bg-white" placeholder="Bridal Choker..." />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">SKU Code</label>
                   <input required type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full border p-2 text-sm rounded bg-white" placeholder="GG-BR-001" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                   <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full border p-2 text-sm rounded bg-white">
                     <option value="Necklaces">Necklaces</option>
                     <option value="Earrings">Earrings</option>
                     <option value="Rings">Rings</option>
                     <option value="Bracelets">Bracelets</option>
                     <option value="Bangles">Bangles</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Jewelry Type</label>
                   <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value as any})} className="w-full border p-2 text-sm rounded bg-white">
                     <option value="Artificial">Premium Artificial</option>
                     <option value="1 Gram Gold">1 Gram Gold</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Base Material</label>
                   <input required type="text" value={newProduct.material} onChange={e => setNewProduct({...newProduct, material: e.target.value})} className="w-full border p-2 text-sm rounded bg-white" placeholder="Copper / Brass / Alloy" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Stock Quantity</label>
                   <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-white" />
                 </div>
                 <div className="sm:col-span-2">
                   <label className="block text-xs font-bold text-stone-600 mb-1">Product Photo</label>
                   <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded border">
                     {newProduct.images && newProduct.images.length > 0 && newProduct.images[0] ? (
                       <div className="flex gap-2 flex-wrap">
                         {newProduct.images.map((img, i) => (
                           <div key={i} className="relative group">
                             <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded border shadow-sm" referrerPolicy="no-referrer" />
                             <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="w-16 h-16 bg-stone-100 rounded border border-dashed flex items-center justify-center text-[10px] text-stone-400 text-center">No Photo</div>
                     )}
                     <div className="flex-1 w-full flex flex-col gap-2">
                       <input type="text" value={newProduct.images ? newProduct.images.join(', ') : ''} onChange={e => setNewProduct({...newProduct, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="Or paste image URLs separated by comma..." className="w-full border p-2 text-sm rounded bg-stone-50" />
                       <input type="file" multiple onChange={handleImageUpload} accept="image/jpeg,image/png,image/webp,image/jpg" className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#C9A66B]/10 file:text-[#C9A66B] hover:file:bg-[#C9A66B]/20 cursor-pointer" />
                     </div>
                   </div>
                   <p className="text-[10px] text-stone-400 mt-1">Upload multiple photos or paste URLs. Drag-and-drop works too. Max 10MB.</p>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">MRP Price (₹)</label>
                   <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-white" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Discount/Sell Price (₹)</label>
                   <input required type="number" value={newProduct.discountPrice} onChange={e => setNewProduct({...newProduct, discountPrice: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-white" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Plating</label>
                   <input type="text" value={newProduct.plating} onChange={e => setNewProduct({...newProduct, plating: e.target.value})} className="w-full border p-2 text-sm rounded bg-white" placeholder="Gold Plated" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-600 mb-1">Sizes (comma separated)</label>
                   <input required type="text" value={newProduct.sizeOptions?.join(', ')} onChange={e => setNewProduct({...newProduct, sizeOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full border p-2 text-sm rounded bg-white" placeholder="Free Size, 2.4, 2.6" />
                 </div>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Description</label>
                  <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full border p-2 text-sm rounded bg-white h-20" placeholder="Product details..." />
               </div>

               <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Care Guide & Information</label>
                  <textarea value={newProduct.careGuide} onChange={e => setNewProduct({...newProduct, careGuide: e.target.value})} className="w-full border p-2 text-sm rounded bg-white h-20" placeholder="Keep away from water..." />
               </div>

               <div className="flex justify-end pt-2">
                 <button type="submit" className="bg-[#1D1D1D] text-[#C9A66B] hover:bg-black px-6 py-2 text-sm font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-2">
                   {editingId ? 'Update Product' : 'Save Product'}
                 </button>
               </div>
             </form>

             <div className="mt-8 space-y-4">
               <h3 className="font-bold text-sm uppercase tracking-wider text-stone-700 border-b pb-2">Current Catalogue Items ({products.length})</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {products.map(p => (
                   <div key={p.id} className="border border-stone-200 p-4 rounded flex justify-between items-center group hover:border-[#C9A66B] transition-colors bg-white">
                     <div className="flex items-center gap-4">
                       <img src={p.images[0] || 'https://via.placeholder.com/600'} alt="" className="w-12 h-12 rounded object-cover border" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600?text=No+Image'; }} />
                       <div>
                         <p className="font-bold text-sm text-stone-900 line-clamp-1">{p.name}</p>
                         <p className="text-xs text-stone-500 font-mono">{p.sku} • ₹{p.discountPrice} • Stock: {p.stock}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <label className="flex items-center gap-1.5 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={p.isFeatured || false} 
                           onChange={(e) => onEditProduct({ ...p, isFeatured: e.target.checked })} 
                           className="w-3.5 h-3.5 text-[#C9A66B] rounded focus:ring-[#C9A66B]" 
                         />
                         <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Featured</span>
                       </label>
                       <button onClick={() => handleEditClick(p)} className="text-stone-400 hover:text-[#C9A66B] p-2 transition-colors ml-2">
                         <Sliders className="w-4 h-4" />
                       </button>
                       <button onClick={() => {
                         if(confirm('Are you sure you want to delete this product?')) {
                           onDeleteProduct(p.id);
                         }
                       }} className="text-stone-300 hover:text-red-500 p-2 transition-colors">
                         <Trash2 className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                 ))}
                 {products.length === 0 && (
                   <div className="col-span-2 text-center text-sm text-gray-400 py-10 bg-stone-50 rounded italic">
                     No products in inventory yet.
                   </div>
                 )}
               </div>
             </div>
          </div>
        )}

        {activeSubTab === 'social' && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Reviews & Video Testimonials</h2>
              <p className="text-sm text-gray-500 mt-1">Moderate customer reviews and curate YouTube / Instagram videos attached to each product.</p>
            </div>

            <div className="flex gap-2 border-b">
              <button
                onClick={() => setSocialTab('reviews')}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${socialTab === 'reviews' ? 'border-b-2 border-[#C9A66B] text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
              >
                <MessageCircle className="inline w-4 h-4 mr-1" /> Customer Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setSocialTab('videos')}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${socialTab === 'videos' ? 'border-b-2 border-[#C9A66B] text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
              >
                <Video className="inline w-4 h-4 mr-1" /> Video Reviews ({videos.length})
              </button>
            </div>

            {socialTab === 'reviews' && (
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-center text-sm text-stone-500 py-12 bg-stone-50 rounded">No customer reviews yet. They will appear here once customers submit them from product pages.</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-stone-200 p-3 rounded bg-white flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#A67C52] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-stone-900">{r.name} {r.verified && <ShieldCheck className="inline w-3 h-3 text-green-500 ml-1" />}</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Product: <span className="font-mono">{r.productSku}</span> · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                            {r.location && <> · {r.location}</>}
                          </p>
                          <p className="text-sm text-stone-700 mt-1.5">{r.comment}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={async () => {
                                const updated = { ...r, verified: !r.verified };
                                const saved = await saveReview(updated);
                                setReviews(prev => prev.map(x => x.id === saved.id ? saved : x));
                              }}
                              className="text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-emerald-600"
                            >
                              {r.verified ? 'Unverify' : 'Mark Verified'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this review?')) return;
                                await deleteReview(r.id);
                                setReviews(prev => prev.filter(x => x.id !== r.id));
                              }}
                              className="text-[10px] uppercase tracking-wider font-bold text-stone-500 hover:text-red-600"
                            >
                              <Trash2 className="inline w-3 h-3 mr-0.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {socialTab === 'videos' && (
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newVideo.title.trim() || !newVideo.url.trim() || !newVideo.productSku.trim()) {
                      alert('Title, URL, and Product SKU are all required.');
                      return;
                    }
                    const v: VideoReview = {
                      id: editingVideo?.id || uuidv4(),
                      productSku: newVideo.productSku.trim(),
                      title: newVideo.title.trim(),
                      url: newVideo.url.trim(),
                      thumbnail: newVideo.thumbnail.trim() || undefined,
                      createdAt: editingVideo?.createdAt || new Date().toISOString(),
                    };
                    const saved = await saveVideoReview(v);
                    setVideos(prev => {
                      const without = prev.filter(x => x.id !== saved.id);
                      return [saved, ...without];
                    });
                    setNewVideo({ title: '', url: '', productSku: '', thumbnail: '' });
                    setEditingVideo(null);
                    alert(editingVideo ? 'Video updated.' : 'Video added.');
                  }}
                  className="bg-stone-50 p-4 rounded border border-stone-200 space-y-3"
                >
                  <h3 className="font-bold text-sm uppercase tracking-wider text-stone-700">
                    {editingVideo ? 'Edit Video' : 'Add New Video Review'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Video title (e.g. Founder Unboxing)"
                      value={newVideo.title}
                      onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="border p-2 text-sm rounded bg-white"
                      required
                    />
                    <select
                      value={newVideo.productSku}
                      onChange={e => setNewVideo({ ...newVideo, productSku: e.target.value })}
                      className="border p-2 text-sm rounded bg-white"
                      required
                    >
                      <option value="">— Pick a product (by SKU) —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="YouTube / Instagram / MP4 URL"
                      value={newVideo.url}
                      onChange={e => setNewVideo({ ...newVideo, url: e.target.value })}
                      className="border p-2 text-sm rounded bg-white sm:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Custom thumbnail URL (optional)"
                      value={newVideo.thumbnail}
                      onChange={e => setNewVideo({ ...newVideo, thumbnail: e.target.value })}
                      className="border p-2 text-sm rounded bg-white sm:col-span-2"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Accepts YouTube watch / youtu.be / shorts links, Instagram reels, or direct MP4 URLs.</p>
                  <div className="flex justify-end gap-2">
                    {editingVideo && (
                      <button
                        type="button"
                        onClick={() => { setEditingVideo(null); setNewVideo({ title: '', url: '', productSku: '', thumbnail: '' }); }}
                        className="px-4 py-2 text-xs font-semibold text-stone-600"
                      >Cancel</button>
                    )}
                    <button type="submit" className="bg-[#1D1D1D] text-[#C9A66B] hover:bg-black px-5 py-2 text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" /> {editingVideo ? 'Update Video' : 'Add Video'}
                    </button>
                  </div>
                </form>

                {videos.length === 0 ? (
                  <p className="text-center text-sm text-stone-500 py-8 bg-stone-50 rounded">No video reviews added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {videos.map(v => (
                      <div key={v.id} className="border border-stone-200 p-3 rounded bg-white flex items-center gap-3">
                        <div className="w-20 h-12 bg-black rounded flex items-center justify-center shrink-0">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">{v.title}</p>
                          <p className="text-xs text-stone-500 truncate font-mono">SKU {v.productSku} · {v.url}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingVideo(v);
                              setNewVideo({ title: v.title, url: v.url, productSku: v.productSku, thumbnail: v.thumbnail || '' });
                            }}
                            className="text-xs text-stone-500 hover:text-[#C9A66B] uppercase font-bold"
                          >Edit</button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this video?')) return;
                              await deleteVideoReview(v.id);
                              setVideos(prev => prev.filter(x => x.id !== v.id));
                            }}
                            className="text-xs text-stone-500 hover:text-red-600 uppercase font-bold"
                          >
                            <Trash2 className="inline w-3 h-3 mr-0.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'settings' && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Platform Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Configure your storefront operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Store Name</label>
                <input type="text" value={settingsForm.storeName || ''} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" placeholder="Glitter Glam" />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Logo Image URL</label>
                <input type="text" value={settingsForm.logoUrl || ''} onChange={e => setSettingsForm({...settingsForm, logoUrl: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" placeholder="https://..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Hero Section Background Image URL</label>
                <input type="text" value={settingsForm.heroBannerImage || ''} onChange={e => setSettingsForm({...settingsForm, heroBannerImage: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" placeholder="https://..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Hero Slideshow Photos</label>
                <div className="bg-white border rounded p-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(settingsForm.heroGalleryImages || []).map((img, idx) => (
                      <div key={`${img}-${idx}`} className="relative group">
                        <img src={img} alt={`Slide ${idx + 1}`} className="w-20 h-20 rounded object-cover border" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={async () => {
                            const removed = (settingsForm.heroGalleryImages || [])[idx];
                            const nextImages = (settingsForm.heroGalleryImages || []).filter((_, i) => i !== idx);
                            const nextSettings = { ...settingsForm, heroGalleryImages: nextImages };
                            setSettingsForm(nextSettings);
                            onUpdateSettings(nextSettings);
                            // Best-effort cleanup: if the removed image was hosted
                            // in our Supabase 'assets' bucket under hero-gallery/,
                            // also delete the underlying object so the bucket
                            // doesn't fill up with orphaned photos.
                            try {
                              if (removed && removed.includes('/storage/v1/object/public/assets/hero-gallery/')) {
                                const { supabase } = await import('../lib/supabaseClient');
                                if (supabase) {
                                  const objectPath = decodeURIComponent(
                                    removed.split('/storage/v1/object/public/assets/')[1] || ''
                                  );
                                  if (objectPath) {
                                    await supabase.storage.from('assets').remove([objectPath]);
                                  }
                                }
                              }
                            } catch (cleanupErr) {
                              console.warn('Hero gallery object cleanup skipped:', cleanupErr);
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(settingsForm.heroGalleryImages || []).length === 0 && (
                      <div className="text-xs text-stone-400 italic py-8">No slideshow photos yet.</div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={(settingsForm.heroGalleryImages || []).join(', ')}
                    onChange={e => setSettingsForm({
                      ...settingsForm,
                      heroGalleryImages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full border p-2 text-sm rounded bg-stone-50"
                    placeholder="Paste image URLs separated by comma"
                  />
                  <input
                    type="file"
                    multiple
                    onChange={handleGalleryUpload}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#C9A66B]/10 file:text-[#C9A66B] hover:file:bg-[#C9A66B]/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-stone-400">Upload multiple photos or paste URLs. These will play as a looping slideshow on the homepage.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Top Announcement Banner</label>
                <input type="text" value={settingsForm.announcementText} onChange={e => setSettingsForm({...settingsForm, announcementText: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">WhatsApp Order Number</label>
                <input type="text" value={settingsForm.whatsappContact} onChange={e => setSettingsForm({...settingsForm, whatsappContact: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" placeholder="+91 98769 76655" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Hero Section Headline</label>
                <input type="text" value={settingsForm.heroHeadline} onChange={e => setSettingsForm({...settingsForm, heroHeadline: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Hero Section Subtitle</label>
                <input type="text" value={settingsForm.heroSubtitle} onChange={e => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Support Email</label>
                <input type="email" value={settingsForm.supportEmail} onChange={e => setSettingsForm({...settingsForm, supportEmail: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Instagram Handle</label>
                <input type="text" value={settingsForm.instagramHandle} onChange={e => setSettingsForm({...settingsForm, instagramHandle: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Facebook Handle (Optional)</label>
                <input type="text" value={settingsForm.facebookHandle || ''} onChange={e => setSettingsForm({...settingsForm, facebookHandle: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Store Timings</label>
                <input type="text" value={settingsForm.storeTiming || ''} onChange={e => setSettingsForm({...settingsForm, storeTiming: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Physical Store Address</label>
                <textarea value={settingsForm.storeAddress} onChange={e => setSettingsForm({...settingsForm, storeAddress: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50 h-20" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">About Us Content</label>
                <textarea value={settingsForm.aboutUsContent || ''} onChange={e => setSettingsForm({...settingsForm, aboutUsContent: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50 h-32" placeholder="Our story..." />
              </div>

              {/* Trust Partners Manager */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Trust Partners (logos shown in footer)</label>
                <div className="space-y-2">
                  {(settingsForm.trustPartners || []).map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img src={t.logoUrl} alt={t.name} className="h-8 w-20 object-contain border" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = '/assets/logo.jpeg'; }} />
                      <div className="flex-1 text-sm">{t.name} — <a href={t.href || '#'} className="text-xs text-blue-600">link</a></div>
                      <button type="button" onClick={() => setSettingsForm({...settingsForm, trustPartners: (settingsForm.trustPartners || []).filter((_,i) => i !== idx)})} className="text-red-500 text-sm">Remove</button>
                    </div>
                  ))}

                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="Partner name" value={newTrust.name} onChange={e => setNewTrust({...newTrust, name: e.target.value})} className="border p-2 text-sm rounded bg-white" />
                    <input type="text" placeholder="Logo URL" value={newTrust.logoUrl} onChange={e => setNewTrust({...newTrust, logoUrl: e.target.value})} className="border p-2 text-sm rounded bg-white" />
                    <input type="text" placeholder="Link (optional)" value={newTrust.href} onChange={e => setNewTrust({...newTrust, href: e.target.value})} className="border p-2 text-sm rounded bg-white" />
                    <button type="button" onClick={() => {
                      if(!newTrust.name || !newTrust.logoUrl) return alert('Provide name and logo URL');
                      setSettingsForm({...settingsForm, trustPartners: [...(settingsForm.trustPartners || []), newTrust]});
                      setNewTrust({ name: '', logoUrl: '', href: '' });
                    }} className="bg-[#C9A66B] text-white px-3 py-2 rounded">Add</button>
                  </div>
                </div>
              </div>

              {/* Reviews Manager */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Customer Reviews (visible on home page)</label>
                <div className="space-y-2">
                  {(settingsForm.reviews || []).map((r) => (
                    <div key={r.id} className="flex items-start gap-3 border p-2 rounded bg-white">
                      <div className="flex-1">
                        <div className="font-bold text-sm">{r.name} <span className="text-xs text-[#C9A66B]">{'★'.repeat(r.rating)}</span></div>
                        <div className="text-xs text-stone-600">{r.text}</div>
                        <div className="text-[10px] text-stone-400">{r.source}</div>
                      </div>
                      <div>
                        <button type="button" onClick={() => setSettingsForm({...settingsForm, reviews: (settingsForm.reviews || []).filter(rr => rr.id !== r.id)})} className="text-red-500 text-sm">Remove</button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input type="text" placeholder="Customer name" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="border p-2 text-sm rounded bg-white sm:col-span-1" />
                    <input type="number" min={1} max={5} placeholder="Rating 1-5" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})} className="border p-2 text-sm rounded bg-white sm:col-span-1" />
                    <input type="text" placeholder="Source (WhatsApp/Instagram)" value={newReview.source} onChange={e => setNewReview({...newReview, source: e.target.value})} className="border p-2 text-sm rounded bg-white sm:col-span-1" />
                    <button type="button" onClick={() => {
                      if(!newReview.name || !newReview.text) return alert('Provide name and review text');
                      const rev = { ...newReview, id: uuidv4() };
                      setSettingsForm({...settingsForm, reviews: [...(settingsForm.reviews || []), rev]});
                      setNewReview({ name: '', rating: 5, text: '', source: '' });
                    }} className="bg-[#C9A66B] text-white px-3 py-2 rounded">Add Review</button>
                    <textarea placeholder="Review text" value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} className="col-span-1 sm:col-span-4 border p-2 text-sm rounded bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Total Orders (Manual Override)</label>
                <input type="number" value={settingsForm.totalOrders || 0} onChange={e => setSettingsForm({...settingsForm, totalOrders: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-600">Total Income Generated (₹)</label>
                <input type="number" value={settingsForm.totalIncome || 0} onChange={e => setSettingsForm({...settingsForm, totalIncome: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-stone-50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-stone-600">Google Analytics Measurement ID</label>
                <input type="text" value={settingsForm.googleAnalyticsId || ''} onChange={e => setSettingsForm({...settingsForm, googleAnalyticsId: e.target.value})} className="w-full border p-2 text-sm rounded bg-stone-50" placeholder="G-XXXXXXXXXX" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button onClick={handleSettingsSave} className="bg-[#1D1D1D] text-emerald-400 hover:bg-black px-8 py-3 text-sm font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
