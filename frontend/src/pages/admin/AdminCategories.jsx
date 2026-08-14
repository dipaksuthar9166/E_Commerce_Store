import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Layers } from 'lucide-react';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  SearchField,
  DataTable,
  TableHead,
  Th,
  TableBody,
  Tr,
  TableEmpty,
  TableSkeleton,
  TableFooter,
  PrimaryButton,
  SecondaryButton,
  fieldClass,
  labelClass,
  tdClass,
} from '../../components/ui/PageUI';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setIsEditing(true);
    } else {
      setCurrentCategory({ name: '' });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentCategory({ name: '' });
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCategory.name.trim()) return;

    try {
      if (isEditing) {
        await api.put(`/admin/categories/${currentCategory._id}`, {
          name: currentCategory.name,
        });
      } else {
        await api.post('/admin/categories', { name: currentCategory.name });
      }
      fetchCategories();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title="Master Categories"
        subtitle="Manage global categories for the marketplace."
        actions={
          <>
            <RefreshButton onClick={fetchCategories} loading={loading} />
            <PrimaryButton onClick={() => handleOpenModal()}>
              <Plus size={16} /> Add Category
            </PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Categories"
          value={loading ? '—' : categories.length}
          subtitle="Platform-wide"
          icon={Layers}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-indigo-400 via-violet-400 to-fuchsia-500"
        />
      </div>

      <SurfaceCard delay={0.08}>
        <SearchField
          label="Search Categories"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SurfaceCard>

      <SurfaceCard padding={false} delay={0.12}>
        <CardHeader
          title="Categories Directory"
          subtitle={`${filteredCategories.length} result${filteredCategories.length !== 1 ? 's' : ''}`}
        />

        <DataTable minWidth="480px">
          <TableHead>
            <Th>Category Name</Th>
            <Th className="text-right">Actions</Th>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} colSpan={2} />
            ) : filteredCategories.length === 0 ? (
              <TableEmpty
                icon={Layers}
                title="No categories found"
                subtitle="Add a category or adjust your search."
                colSpan={2}
              />
            ) : (
              filteredCategories.map((cat) => (
                <Tr key={cat._id}>
                  <td className={`${tdClass} font-semibold text-slate-800 dark:text-slate-100`}>
                    {cat.name}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(cat)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </Tr>
              ))
            )}
          </TableBody>
        </DataTable>

        {!loading && (
          <TableFooter>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredCategories.length} of {categories.length} categories
            </p>
          </TableFooter>
        )}
      </SurfaceCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className={labelClass}>Category Name</label>
                <input
                  type="text"
                  value={currentCategory.name}
                  onChange={(e) =>
                    setCurrentCategory({ ...currentCategory, name: e.target.value })
                  }
                  placeholder="e.g. Electronics, Clothing"
                  className={fieldClass}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <SecondaryButton type="button" onClick={handleCloseModal}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit">
                  {isEditing ? 'Save Changes' : 'Create Category'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminCategories;
