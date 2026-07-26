import React, { useState, useEffect } from 'react';
import { Users, Package, ShoppingBag, DollarSign, AlertCircle, TrendingUp, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import MainLayout from '../layouts/MainLayout';

const AdminDashboard = () => {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', image_url: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, usersRes, catsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/products/pending'),
        api.get('/admin/users'),
        api.get('/categories'),
        api.get('/orders'),
      ]);
      setStats(statsRes.data);
      setPendingProducts(pendingRes.data);
      setUsers(usersRes.data);
      setCategories(catsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId, approved) => {
    try {
      await api.post(`/products/${productId}/approve?approved=${approved}`);
      toast.success(`Produto ${approved ? 'aprovado' : 'rejeitado'}`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao processar');
    }
  };

  const handleApproveSeller = async (userId, approved) => {
    try {
      await api.post(`/admin/sellers/${userId}/approve?approved=${approved}`);
      toast.success(`Vendedor ${approved ? 'aprovado' : 'rejeitado'}`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao processar');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories/', newCat);
      toast.success('Categoria criada!');
      setNewCat({ name: '', description: '', image_url: '' });
      setShowCatForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Excluir categoria?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria excluída');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Usuários', value: stats?.total_users || 0, color: 'text-blue-500' },
    { icon: Package, label: 'Total Produtos', value: stats?.total_products || 0, color: 'text-green-500' },
    { icon: ShoppingBag, label: 'Total Pedidos', value: stats?.total_orders || 0, color: 'text-purple-500' },
    { icon: DollarSign, label: 'Receita Total', value: formatPrice(stats?.total_revenue || 0), color: 'text-yellow-500' },
    { icon: AlertCircle, label: 'Produtos Pendentes', value: stats?.pending_products || 0, color: 'text-red-500' },
    { icon: TrendingUp, label: 'Vendedores Pendentes', value: stats?.pending_sellers || 0, color: 'text-orange-500' },
  ];

  const tabs = [
    { id: 'stats', label: 'Estatísticas' },
    { id: 'products', label: 'Produtos Pendentes' },
    { id: 'users', label: 'Usuários' },
    { id: 'categories', label: 'Categorias' },
    { id: 'orders', label: 'Pedidos' },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-black" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
          Dashboard Admin
        </h1>

        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} data-testid={`admin-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            {pendingProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum produto pendente</p>
            ) : (
              pendingProducts.map((product) => (
                <div key={product.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                      <p className="text-primary font-bold mt-2">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveProduct(product.id, true)} data-testid={`approve-product-${product.id}`} className="px-4 py-2 rounded-full bg-green-500 text-white hover:opacity-90 font-medium">Aprovar</button>
                    <button onClick={() => handleApproveProduct(product.id, false)} className="px-4 py-2 rounded-full bg-red-500 text-white hover:opacity-90 font-medium">Rejeitar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-4 gap-4 p-4 font-semibold border-b border-border">
              <span>Nome</span>
              <span>Email</span>
              <span>Role / Status</span>
              <span>Ações</span>
            </div>
            {users.map((usr) => (
              <div key={usr.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 p-4 bg-surface border border-border rounded-lg items-center">
                <span className="font-medium">{usr.name}</span>
                <span className="text-sm text-muted-foreground">{usr.email}</span>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${usr.role === 'admin' ? 'bg-primary text-primary-foreground' : usr.role === 'seller' ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                    {usr.role}
                  </span>
                  {usr.role === 'seller' && (
                    <span className={`px-2 py-1 rounded-full text-xs ${usr.is_approved ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {usr.is_approved ? 'Aprovado' : 'Pendente'}
                    </span>
                  )}
                </div>
                <div>
                  {usr.role === 'seller' && !usr.is_approved && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveSeller(usr.id, true)} className="px-3 py-1 rounded-full bg-green-500 text-white text-xs">Aprovar</button>
                      <button onClick={() => handleApproveSeller(usr.id, false)} className="px-3 py-1 rounded-full bg-red-500 text-white text-xs">Rejeitar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowCatForm(!showCatForm)} data-testid="admin-add-category" className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90">
                <Plus className="w-4 h-4" /> Nova Categoria
              </button>
            </div>

            {showCatForm && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Nova Categoria</h3>
                  <button onClick={() => setShowCatForm(false)} className="p-1 hover:bg-muted rounded-full"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <input type="text" placeholder="Nome" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-background border border-border" />
                  <input type="text" placeholder="Descrição" value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-background border border-border" />
                  <input type="text" placeholder="URL da imagem" value={newCat.image_url} onChange={(e) => setNewCat({ ...newCat, image_url: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-background border border-border" />
                  <button type="submit" className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-semibold">Criar</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-semibold text-sm">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 hover:bg-muted rounded-full"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum pedido ainda</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-bold">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
